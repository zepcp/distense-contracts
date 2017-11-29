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
  //  Does this happen at time of reward determination or at simple addTask or both
  event LogAddTask(bytes32 taskId);
  event LogRewardVote(bytes32 taskId, uint256 reward, uint256 pctDIDVoted);
  event LogVoterBalance(uint256 voterBalance);
  event LogRewardDetermined(bytes32 indexed taskId, uint256 sum);

  function Tasks(address _DIDTokenAddress, address _DistenseAddress) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
  }

  function addTask(bytes32 _taskId) public hasDID(msg.sender) returns (bool) {
    require(_taskId[0] != 0);
    tasks[_taskId].createdBy = msg.sender;
    tasks[_taskId].reward = 0;
    taskIds.push(_taskId);
    LogAddTask(_taskId);
    return true;
  }

  function getTaskById(bytes32 _taskId) public view returns (address, uint256, uint256, bool, uint256 pctDIDVoted) {
    Task memory task = tasks[_taskId];
    return (task.createdBy, task.reward, task.rewardVoters.length, task.rewardPaid, task.pctDIDVoted);
  }

  function taskExists(bytes32 _taskId) public view returns (bool) {
    return tasks[_taskId].createdBy != 0;
  }

  function getNumTasks() public view returns (uint) {
    return taskIds.length;
  }

  // Make sure voter hasn't voted and the reward for this task isn't set
  function voteOnReward(bytes32 _taskId, uint256 _reward)
//    voterNotVotedOnTask(_taskId)
//    rewardWithinParameterLimit(_reward)
  external returns (bool) {
//    require(!reachedProposalApprovalThreshold(_taskId));
    Task storage _task = tasks[_taskId];
    _task.rewardVotes[msg.sender] = _reward;
    _task.rewardVoters.push(msg.sender);
    LogString('_task.rewardVoters.length');
    LogUInt256(_task.rewardVoters.length);
    uint256 _pctDIDVoted = percentDIDVoted(_taskId);
    LogString('_pctDIDVoted');
    LogUInt256(_pctDIDVoted);
//    _task.pctDIDVoted = _pctDIDVoted;
//    LogString('_task.pctDIDVoted');
//    LogUInt256(_task.pctDIDVoted);
//
//    //  If DID threshold has been reached go ahead and determine the reward for the task
//    bool enoughDIDVoted = reachedProposalApprovalThreshold(_taskId);
//    LogString('enoughDIDVoted');
//    LogBool(enoughDIDVoted);
//    if (enoughDIDVoted || _task.rewardVoters.length == 100) {
//      uint256 determinedReward = determineReward(_taskId);
//      LogString('determinedReward');
//      LogUInt256(determinedReward );
//    }
//    LogRewardVote(_taskId, _reward, _pctDIDVoted);
    return true;
  }

  function numDIDVotedOnTask(bytes32 _taskId) public returns (uint256) {
    Task storage _task = tasks[_taskId];

    uint256 numRewardVoters = _task.rewardVoters.length;
    LogString('numRewardVoters');
    LogUInt256(numRewardVoters);
    uint256 limit = numRewardVoters > 10 ? 10 : numRewardVoters;

    uint256 _numDIDVoted = 0;
    for (uint8 i = 0; i < limit; i++) {
      DIDToken didToken = DIDToken(DIDTokenAddress);
      uint256 didBalance = didToken.balances(_task.rewardVoters[i]);
      _numDIDVoted += didBalance;
    }
    LogString('_numDIDVoted');
    LogUInt256(_numDIDVoted);
    return _numDIDVoted;
  }

  function reachedProposalApprovalThreshold(bytes32 _taskId) public view returns (bool) {
    Distense distense = Distense(DistenseAddress);
    bytes32 title = distense.proposalPctDIDApprovalTitle();
    uint256 threshold = distense.getParameterValue(title);
    return percentDIDVoted(_taskId) >= threshold;
  }

  function percentDIDVoted(bytes32 _taskId) public returns (uint256) {
    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 totalSupply = didToken.totalSupply();
    LogString('totalSupply');
    LogUInt256(totalSupply);
    uint256 numDIDVoted = numDIDVotedOnTask(_taskId);
    LogString('numDIDVoted ');
    LogUInt256(numDIDVoted );
    uint256 pctDIDVoted = SafeMath.percent(numDIDVoted, totalSupply, 3);
    LogString('pctDIDVoted in percentDIDVoted');
    LogUInt256(pctDIDVoted);
    return pctDIDVoted;
  }

  function determineReward(bytes32  _taskId) public returns (uint256) {
    //    require(!haveReachedProposalApprovalThreshold(_taskId));

    Task storage _task = tasks[_taskId];

    uint256 _numDIDVoted = numDIDVotedOnTask(_taskId);
    LogString('_numDIDVoted');
    LogUInt256(_numDIDVoted);
    uint256 _sum = 0;
    address _voter;

    LogString('_task.rewardVoters.length');
    LogUInt256(_task.rewardVoters.length);
    for (uint8 i = 0; i <= 20; i++) {
      _voter = _task.rewardVoters[i];
      //      uint rewardVote = _task.rewardVotes[_voter] * 100;
      //      LogString('rewardVote');
      //      LogUInt256(rewardVote);
      //      DIDToken didToken = DIDToken(DIDTokenAddress);
      //      uint256 voterDIDBalance = didToken.balances(_voter) * 100;
      //      LogString('voterDIDBalance');
      //      LogUInt256(voterDIDBalance);
      //      uint totalDIDVoted = _numDIDVoted * 100;
      //      _sum += rewardVote * (voterDIDBalance / totalDIDVoted);
    }

    //    LogUInt256(_sum);
    //    _task.reward = _sum;
    //    _task.rewardPaid = false;
    //    LogRewardDetermined(_taskId, _sum);
    return _sum;
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
    uint256 numDID = didToken.balances(voter);
    require(numDID > 0);
    _;
  }

  modifier rewardWithinParameterLimit(uint256 _reward) {
    Distense distense = Distense(DistenseAddress);
    uint256 maxReward = distense.getParameterValue(distense.maxRewardParameterTitle());
    require(_reward <= maxReward);
    _;
  }

}
