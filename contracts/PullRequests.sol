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
        uint64 prNum;
        uint256 pctDIDApproved;
        mapping(address => bool) voted;
    }

    bytes32[] public pullRequestIds;

    mapping(bytes32 => PullRequest) pullRequests;

    event LogAddPullRequest(bytes32 _prId, bytes32 taskId);
    event LogPullRequestApprovalVote(bytes32 _prId, uint256 pctDIDApproved);
    event LogRewardPullRequest(bytes32 _prId, bytes32 taskId);

    function PullRequests(
        address _DIDTokenAddress,
        address _DistenseAddress,
        address _TasksAddress
    ) public {
        DIDTokenAddress = _DIDTokenAddress;
        DistenseAddress = _DistenseAddress;
        TasksAddress = _TasksAddress;
    }


    function addPullRequest(bytes32 _prId, bytes32 _taskId) external returns (bool) {
        pullRequests[_prId].contributor = msg.sender;
        pullRequests[_prId].taskId = _taskId;
        pullRequestIds.push(_prId);

        LogAddPullRequest(_prId, _taskId);

        return true;
    }


    function getPullRequestById(bytes32 _prId) external view returns (address, bytes32, uint64, uint256) {
        PullRequest memory pr = pullRequests[_prId];
        return (pr.contributor, pr.taskId, pr.prNum, pr.pctDIDApproved);
    }


    function getNumPullRequests() external view returns (uint256) {
        return pullRequestIds.length;
    }


    function approvePullRequest(bytes32 _prId)
        hasntVoted(_prId)
        hasEnoughDIDToApprovePR()
        external
    returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        DIDToken didToken = DIDToken(DIDTokenAddress);

        require(didToken.balances(msg.sender) >= distense.getParameterValueByTitle(
            distense.numDIDRequiredToApproveVotePullRequestParameterTitle()
        ));

        PullRequest storage _pr = pullRequests[_prId];

        //  Record approval vote to prevent multiple voting
        _pr.voted[msg.sender] = true;
        _pr.pctDIDApproved += didToken.pctDIDOwned(msg.sender);

        if (
            _pr.pctDIDApproved > distense.getParameterValueByTitle(
            distense.pctDIDRequiredToMergePullRequestTitle()
            )
        ) {
            Tasks tasks = Tasks(TasksAddress);
            var (reward, rewardStatus) = tasks.getTaskRewardAndStatus(_pr.taskId);
            require(rewardStatus != Tasks.RewardStatus.PAID);
            //  Only issueDID after we confirm taskRewardPaid
            Tasks.RewardStatus updatedRewardStatus = tasks.setTaskRewardPaid(_pr.taskId);
            require(updatedRewardStatus == Tasks.RewardStatus.PAID);
//            didToken.issueDID(_pr.contributor, reward);
            LogRewardPullRequest(_prId, _pr.taskId);
        }

        LogPullRequestApprovalVote(_prId, _pr.pctDIDApproved);
        return _pr.pctDIDApproved;

    }

    modifier hasntVoted(bytes32 _prId) {
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
