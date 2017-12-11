pragma solidity ^0.4.17;


import './DIDToken.sol';
import './Debuggable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';


contract Tasks is Debuggable {

  using SafeMath for uint256;

  address public DIDTokenAddress;
  address public DistenseAddress;
  bytes32[] public taskIds;

  struct Task {
    address createdBy;
    uint256 reward;
    address[] rewardVoters;
    bool rewardPaid;
    uint256 pctDIDVoted;
    mapping (address => uint256) rewardVotes;
  }

  mapping (bytes32 => Task) tasks;

  event LogAddTask(bytes32 taskId);
  event LogRewardVote(bytes32 taskId, uint256 reward, uint256 pctDIDVoted);
  event LogVoterBalance(uint256 voterBalance);
  event LogRewardDetermined(bytes32 indexed taskId, uint256 sum);


  function Tasks(address _DIDTokenAddress, address _DistenseAddress) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
  }


  function addTask(bytes32 _taskId) public /*hasDID(msg.sender)*/ returns (bool) {
    require(_taskId[0] != 0);
    tasks[_taskId].createdBy = msg.sender;
    tasks[_taskId].reward = 0;
    taskIds.push(_taskId);
    LogAddTask(_taskId);
    return true;
  }


  function getTaskById(bytes32 _taskId) public view returns (address, uint256, uint256, bool, uint256 pctDIDVoted) {
    Task memory task = tasks[_taskId];
    return (
      task.createdBy,
      task.reward,
      task.rewardVoters.length,
      task.rewardPaid,
      task.pctDIDVoted
    );
  }


  function taskExists(bytes32 _taskId) public view returns (bool) {
    return tasks[_taskId].createdBy != 0;
  }


  function getNumTasks() public view returns (uint) {
    return taskIds.length;
  }


  // Make sure voter hasn't voted and the reward for this task isn't set
  function voteOnReward(bytes32 _taskId, uint256 _reward)
//        voterNotVotedOnTask(_taskId)
//        rewardWithinParameterLimit(_reward)
        hasDID(msg.sender)
  external returns (bool) {
//  require(!reachedProposalApprovalThreshold(_taskId));

    Task storage _task = tasks[_taskId];
    _task.rewardVotes[msg.sender] = _reward;
    _task.rewardVoters.push(msg.sender);

//    DIDToken didToken = DIDToken(DIDTokenAddress);
//    _task.pctDIDVoted += didToken.pctDIDOwned(msg.sender);

    return true;
  }

  function getTaskReward(bytes32 _taskId) public view returns (uint256) {
    return tasks[_taskId].reward;
  }

  modifier voterNotVotedOnTask(bytes32 _taskId) {
    require(tasks[_taskId].rewardVotes[msg.sender] == 0);
    _;
  }

  modifier hasDID(address voter) {
    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 balance = didToken.balances(msg.sender);
    require(balance > 0);
    _;
  }

  modifier rewardWithinParameterLimit(uint256 _reward) {
    Distense distense = Distense(DistenseAddress);
    uint256 maxReward = distense.getParameterValue(distense.maxRewardParameterTitle());
    require(_reward <= maxReward);
    _;
  }

  modifier reachedProposalApprovalThreshold(uint256 pctDIDVoted) {
    Distense distense = Distense(DistenseAddress);
    uint256 threshold = distense.getParameterValue(distense.proposalPctDIDApprovalTitle());
    require(pctDIDVoted >= threshold);
    _;
  }

}
