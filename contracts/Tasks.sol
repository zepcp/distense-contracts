pragma solidity ^0.4.17;


import './DIDToken.sol';
import './Debuggable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';


contract Tasks is Approvable {

  using SafeMath for uint256;

  address public DIDTokenAddress;
  address public DistenseAddress;

  string[] public taskIds;

  struct Task {
    address createdBy;
    uint256 reward;
    bool rewardPaid;
    uint256 pctDIDVoted;
    mapping (address => uint256) rewardVotes;
  }

  mapping (string => Task) tasks;

  event LogAddTask(string taskId);
  event LogRewardVote(string taskId, uint256 reward, uint256 pctDIDVoted);
  event LogRewardDetermined(string indexed taskId, uint256 sum);


  function Tasks(address _DIDTokenAddress, address _DistenseAddress) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
  }


  function addTask(string _taskId) public hasDID(msg.sender) returns (bool) {
    bytes memory bytesTaskId = bytes(_taskId);
    require(bytesTaskId.length > 0);

    tasks[_taskId].createdBy = msg.sender;
    tasks[_taskId].reward = 0;
    tasks[_taskId].rewardPaid = false;

    taskIds.push(_taskId);
    LogAddTask(_taskId);

    return true;
  }


  function getTaskById(string _taskId) public view returns (address, uint256, bool, uint256) {
    return (
      tasks[_taskId].createdBy,
      tasks[_taskId].reward,
      tasks[_taskId].rewardPaid,
      tasks[_taskId].pctDIDVoted
    );
  }


  function taskExists(string _taskId) public view returns (bool) {
    return tasks[_taskId].createdBy != 0;
  }


  function getNumTasks() public view returns (uint) {
    return taskIds.length;
  }


  function voteOnReward(string _taskId, uint256 _reward) public returns (bool) {

    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 balance = didToken.balances(msg.sender);
    Distense distense = Distense(DistenseAddress);

//    Please excuse the following.
//    The stack was too deep so using fewer local vars here instead of in modifiers
//    These if checks are essentially modifiers:
    if (

//    This checks to see if enough DID owners haven't voted on this task.  If they have, let's continue and not allow this vote.
      tasks[_taskId].pctDIDVoted >= distense.getParameterValueByTitle(distense.proposalPctDIDToApproveParameterTitle()) ||

//    Has the voter already voted on this task?
      tasks[_taskId].rewardVotes[msg.sender] != 0 ||

//    Does the voter own at least as many DID as the reward their voting for?
//    This ensures new contributors don't have too much sway over the issuance of new DID.
      balance < _reward ||

//    Don't let the voter vote for 0 reward which will have no effect on the reward and will cost the gas
      _reward < 1 ||

//    Require the reward to be less than or equal to the maximum reward parameter,
//    which basically is a hard, floating limit on the number of DID that can be issued for any single task
      _reward >= distense.getParameterValueByTitle(distense.maxRewardParameterTitle())
    ) return false;

    tasks[_taskId].rewardVotes[msg.sender] = _reward;
    tasks[_taskId].pctDIDVoted = tasks[_taskId].pctDIDVoted + didToken.pctDIDOwned(msg.sender);

    LogRewardVote(_taskId, _reward, tasks[_taskId].pctDIDVoted);

    return true;

}

  function getTaskReward(string _taskId) public view returns (uint256) {
    return tasks[_taskId].reward;
  }


//  TODO is this going to be manually called?
  function setTaskRewardPaid(string _taskId) public onlyApproved returns (bool) {
    tasks[_taskId].rewardPaid = true;
    return true;
  }


  modifier hasDID(address voter) {
    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 balance = didToken.balances(msg.sender);
    require(balance > 0);
    _;
  }

}
