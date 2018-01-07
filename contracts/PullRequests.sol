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
    address contributor;
    bytes32 taskId;
    uint256 pctDIDApproved;
    mapping (address => bool) voted;
  }

  string[] public pullRequestIds;

  mapping (string => PullRequest) pullRequests;

  event LogInt(uint256 someInt);
  event LogRewardPullRequest(string _prId, bytes32 taskId);
  event LogPullRequestApprovalVote(string  _prId, uint256 pctDIDApproved);


  function PullRequests(
    address _DIDTokenAddress,
    address _DistenseAddress,
    address _TasksAddress
  ) public {
    DIDTokenAddress = _DIDTokenAddress;
    DistenseAddress = _DistenseAddress;
    TasksAddress = _TasksAddress;
  }


  //  TODO should we require DID here?
  function addPullRequest(string _prId, bytes32 _taskId) public returns (bool) {
    pullRequests[_prId].contributor = msg.sender;
    pullRequests[_prId].taskId = _taskId;
    pullRequestIds.push(_prId);

    return true;
  }


  function getPullRequestById(string _prId) public view returns (address, bytes32, uint256) {
    PullRequest memory pr = pullRequests[_prId];
    return (pr.contributor, pr.taskId, pr.pctDIDApproved);
  }


  function getNumPullRequests() public view returns (uint256) {
    return pullRequestIds.length;
  }


  function approvePullRequest(string _prId)
    hasntVoted(_prId)
    hasEnoughDIDToApprovePR()
    public
  returns (uint256) {

    Distense distense = Distense(DistenseAddress);
    DIDToken didToken = DIDToken(DIDTokenAddress);

    bytes32 title = distense.numDIDRequiredToApproveVotePullRequestParameterTitle();
    require(didToken.balances(msg.sender) >= distense.getParameterValueByTitle(title));

    PullRequest storage _pr = pullRequests[_prId];

    //  Increment pctDIDApproved by percentage ownership of voter
    _pr.pctDIDApproved += didToken.pctDIDOwned(msg.sender);

    //  Record approval to prevent multiple voting
    _pr.voted[msg.sender] = true;

    if (_pr.pctDIDApproved > distense.getParameterValueByTitle(
      distense.pctDIDRequiredToMergePullRequestTitle()
      )
    ) {
      Tasks tasks = Tasks(TasksAddress);
      uint256 taskReward = tasks.getTaskReward(_pr.taskId);
      tasks.setTaskRewardPaid(_pr.taskId);
//
//      didToken.issueDID(_pr.contributor, taskReward);
//
//      LogRewardPullRequest(_pr.taskId, _prId);
    } else {
      LogPullRequestApprovalVote(_prId, _pr.pctDIDApproved);
    }

    return _pr.pctDIDApproved;

  }

  modifier hasntVoted(string _prId) {
    bool alreadyVoted = pullRequests[_prId].voted[msg.sender];
    require(alreadyVoted == false);
    _;
  }

  modifier hasEnoughDIDToApprovePR() {

    Distense distense = Distense(DistenseAddress);
    uint256 threshold = distense.getParameterValueByTitle(
      distense.numDIDRequiredToApproveVotePullRequestParameterTitle()
    );

    DIDToken didToken = DIDToken(DIDTokenAddress);

    require(didToken.balances(msg.sender) > threshold);
    _;
  }

}
