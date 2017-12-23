pragma solidity ^0.4.17;


import './lib/Approvable.sol';
import './DIDToken.sol';
import './Distense.sol';
import './Tasks.sol';


contract PullRequests is Approvable, Debuggable {


  address public DIDTokenAddress;
  address public DistenseAddress;
  address public TasksAddress;

  struct PullRequest {
    address createdBy;
    bytes32 taskId;
    uint256 pctDIDApproved;
    mapping (address => bool) voted;
  }

  bytes32[] public pullRequestIds;

  mapping (bytes32 => PullRequest) pullRequests;

  event LogInt(uint256 someInt);
  event LogMergeAndRewardPullRequest(bytes32 _prId, bytes32 indexed taskId);
  event LogPullRequestApprovalVote(bytes32 indexed _prId, uint256 pctDIDApproved);


  function PullRequests(address _DIDTokenAddress, address _DistenseAddress, address _TasksAddress) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
    TasksAddress = _TasksAddress;
  }


  //  TODO should we require DID here?
  function addPullRequest(bytes32 _prId, bytes32 _taskId) external returns (bool) {
    pullRequests[_prId].createdBy = msg.sender;
    pullRequests[_prId].taskId = _taskId;
    pullRequestIds.push(_prId);

    return true;
  }


  function getPullRequestById(bytes32 _prId) public view returns (address, bytes32, uint256) {
    PullRequest memory pr = pullRequests[_prId];
    return (pr.createdBy, pr.taskId, pr.pctDIDApproved);
  }


  function getNumPullRequests() public view returns (uint256) {
    return pullRequestIds.length;
  }


//  TODO should we require this to be not over threshold already?  Would save some people some gas
//  I'm guessing we want to do that
  function approvePullRequest(bytes32 _prId)
    hasntVoted(_prId, msg.sender)
    public
  returns (uint256) {

    Distense distense = Distense(DistenseAddress);
    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 didOwned = didToken.balances(msg.sender);

    bytes32 title = distense.numDIDRequiredToApproveVotePullRequestTitle();
    uint256 numDIDRequiredToApproveVotePullRequest = distense.getParameterValueByTitle(title);
    require(didOwned >= numDIDRequiredToApproveVotePullRequest);

    PullRequest storage _pr = pullRequests[_prId];

    //  Increment pctDIDApproved by percentage ownership of voter
    uint256 pctDIDOwned = didToken.pctDIDOwned(msg.sender);
    _pr.pctDIDApproved += pctDIDOwned;

    //  Record approval to prevent multiple voting
    _pr.voted[msg.sender] = true;

    uint256 threshold = distense.getParameterValueByTitle(distense.pctDIDRequiredToMergePullRequestTitle());
    LogString('threshold');
    LogUInt256(threshold);
    if (_pr.pctDIDApproved > threshold) {
      mergeAndRewardPullRequest(_pr.taskId, _prId, _pr.createdBy);
    }

    LogPullRequestApprovalVote(_prId, _pr.pctDIDApproved);

    return _pr.pctDIDApproved;

  }

  function mergeAndRewardPullRequest(bytes32 _taskId, bytes32 _prId, address _contributor) internal returns (bool) {

    LogMergeAndRewardPullRequest(_taskId, _prId);

    Tasks tasks = Tasks(TasksAddress);
    uint256 taskReward = tasks.getTaskReward(_taskId);
    assert(taskReward > 0);
//    DIDToken didToken = DIDToken(DIDTokenAddress);
//    didToken.issueDID(_contributor, taskReward);

    return true;
  }

  modifier hasntVoted(bytes32 _prId, address voter) {
    bool alreadyVoted = pullRequests[_prId].voted[msg.sender];
    require(alreadyVoted == false);
    _;
  }

}
