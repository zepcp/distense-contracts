pragma solidity ^0.4.17;


import './DIDToken.sol';
import './Debuggable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';


contract Tasks is Approvable, Debuggable {

  using SafeMath for uint256;

  address public DIDTokenAddress;
  address public DistenseAddress;

  string[] public taskIds;

  enum RewardStatus { Default, Tentative, Determined, Paid }

  struct Task {
    address createdBy;
    uint256 reward;
    RewardStatus rewardStatus;
    uint256 pctDIDVoted;
    uint256 numVotes;
    mapping (address => bool) rewardVotes;
  }

  struct Vote {
    uint256 vote;
    address voter;
  }

  mapping (string => Task) tasks;

  event LogAddTask(string taskId);
  event LogTaskRewardVote(string taskId, uint256 reward, uint256 pctDIDVoted);
  event LogTaskRewardDetermined(string taskId, uint256 reward);


  function Tasks(address _DIDTokenAddress, address _DistenseAddress) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
  }


  function addTask(string _taskId) public hasEnoughDID(msg.sender, 10) returns (bool) {
    bytes memory bytesTaskId = bytes(_taskId);
    require(bytesTaskId.length > 0);

    Distense distense = Distense(DistenseAddress);
    tasks[_taskId].createdBy = msg.sender;
    tasks[_taskId].reward = distense.getParameterValueByTitle(distense.defaultRewardParameterTitle());
    tasks[_taskId].rewardStatus = RewardStatus.Default;

    taskIds.push(_taskId);
    LogAddTask(_taskId);

    return true;

  }


  function getTaskById(string _taskId) public view returns (address, uint256, Tasks.RewardStatus, uint256) {

    return (
      tasks[_taskId].createdBy,
      tasks[_taskId].reward,
      tasks[_taskId].rewardStatus,
      tasks[_taskId].pctDIDVoted
    );

  }


  function taskExists(string _taskId) public view returns (bool) {
    return tasks[_taskId].createdBy != 0;
  }


  function getNumTasks() public view returns (uint) {
    return taskIds.length;
  }


  function taskRewardVote(string _taskId, uint256 _reward) public returns (bool) {

    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 balance = didToken.balances(msg.sender);
    Distense distense = Distense(DistenseAddress);

    uint256 pctDIDVotedThreshold = distense.getParameterValueByTitle(
      distense.proposalPctDIDToApproveParameterTitle()
    );

    uint256 minNumVoters = distense.getParameterValueByTitle(
      distense.minNumberOfTaskRewardVotersParameterTitle()
    );

    Task storage task = tasks[_taskId];

    require(_reward >= 0);

    //  Essentially refund the remaining gas if user's vote will have no effect
    require(task.reward != _reward);
    require(task.pctDIDVoted < pctDIDVotedThreshold);

    // Restrict voting if enough DID or voters have voted
    require(task.numVotes < minNumVoters);

    //  Has the voter already voted on this task?
    require(!task.rewardVotes[msg.sender]);

    //  Does the voter own at least as many DID as the reward their voting for?
    //  This ensures new contributors don't have too much sway over the issuance of new DID.
    require(balance > distense.getParameterValueByTitle(distense.numDIDRequiredToTaskRewardVoteParameterTitle()));

    //  Require the reward to be less than or equal to the maximum reward parameter,
    //  which basically is a hard, floating limit on the number of DID that can be issued for any single task
    require(_reward <= distense.getParameterValueByTitle(distense.maxRewardParameterTitle()));

    task.rewardVotes[msg.sender] = true;

    uint256 pctDIDOwned = didToken.pctDIDOwned(msg.sender);
    task.pctDIDVoted = task.pctDIDVoted + pctDIDOwned;

    uint256 update = _reward == 0 ? pctDIDOwned : (_reward * pctDIDOwned) / 100;

    if (_reward > task.reward) {
      task.reward += update;
    } else {
      task.reward -= update;
    }

    LogString('updatedReward');
    LogUInt256(task.reward);

    LogTaskRewardVote(_taskId, _reward, task.pctDIDVoted);

    if (task.rewardStatus == RewardStatus.Default)
      task.rewardStatus = RewardStatus.Tentative;
    task.numVotes += 1;

    if (task.pctDIDVoted > pctDIDVotedThreshold || task.numVotes > minNumVoters) {
      LogTaskRewardDetermined(_taskId, task.reward);
      task.rewardStatus = RewardStatus.Determined;
    }

    return true;

  }


  function getTaskReward(string _taskId) public view returns (uint256) {
    return tasks[_taskId].reward;
  }


  //  TODO is this going to be manually called?
  function setTaskRewardPaid(string _taskId) public onlyApproved returns (bool) {
    tasks[_taskId].rewardStatus = RewardStatus.Paid;
    return true;
  }


  modifier hasEnoughDID(address voter, uint256 num) {
    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 balance = didToken.balances(msg.sender);
    require(balance > num);
    _;
  }

}
