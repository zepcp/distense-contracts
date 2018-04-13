pragma solidity ^0.4.21;

import './lib/Approvable.sol';
import './DIDToken.sol';
import './Distense.sol';
import './Tasks.sol';

contract PullRequests is Approvable {

    address public DIDTokenAddress;
    address public DistenseAddress;
    address public TasksAddress;

    struct PullRequest {
        address contributor;
        bytes32 taskId;
        uint128 prNum;
        uint256 pctDIDApproved;
        mapping(address => bool) voted;
    }

    bytes32[] public pullRequestIds;

    mapping(bytes32 => PullRequest) pullRequests;

    event LogAddPullRequest(bytes32 _prId, bytes32 taskId, uint128 prNum);
    event LogPullRequestApprovalVote(bytes32 _prId, uint256 pctDIDApproved);
    event LogRewardPullRequest(bytes32 _prId, bytes32 taskId, uint128 prNum);

    function PullRequests(
        address _DIDTokenAddress,
        address _DistenseAddress,
        address _TasksAddress
    ) public {
        DIDTokenAddress = _DIDTokenAddress;
        DistenseAddress = _DistenseAddress;
        TasksAddress = _TasksAddress;
    }

    function addPullRequest(bytes32 _prId, bytes32 _taskId, uint128 _prNum) external returns (bool) {
        pullRequests[_prId].contributor = msg.sender;
        pullRequests[_prId].taskId = _taskId;
        pullRequests[_prId].prNum = _prNum;
        pullRequestIds.push(_prId);

        emit LogAddPullRequest(_prId, _taskId, _prNum);

        return true;
    }

    function getPullRequestById(bytes32 _prId) external view returns (address, bytes32, uint128, uint256) {
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

        PullRequest storage _pr = pullRequests[_prId];

        //  Record approval vote to prevent multiple voting
        _pr.voted[msg.sender] = true;

        //  This is not very gas efficient at all but the stack was too deep.  Need to refactor/research ways to improve
        _pr.pctDIDApproved += didToken.pctDIDOwned(msg.sender) > distense.getParameterValueByTitle(
            distense.votingPowerLimitParameterTitle()
        ) ? distense.getParameterValueByTitle(
            distense.votingPowerLimitParameterTitle()
        ) : didToken.pctDIDOwned(msg.sender);

        //  where the magic happens
        if (
            _pr.pctDIDApproved > distense.getParameterValueByTitle(
                distense.pctDIDRequiredToMergePullRequestTitle()
            )
        ) {
            Tasks tasks = Tasks(TasksAddress);
            uint256 reward;
            Tasks.RewardStatus rewardStatus;
            (reward , rewardStatus) = tasks.getTaskRewardAndStatus(_pr.taskId);

            require(rewardStatus != Tasks.RewardStatus.PAID);
            Tasks.RewardStatus updatedRewardStatus = tasks.setTaskRewardPaid(_pr.taskId);
            //  Only issueDID after we confirm taskRewardPaid
            require(updatedRewardStatus == Tasks.RewardStatus.PAID);
            didToken.rewardContributor(_pr.contributor, reward);
            emit LogRewardPullRequest(_prId, _pr.taskId, _pr.prNum);
        }

        emit LogPullRequestApprovalVote(_prId, _pr.pctDIDApproved);
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

        require(didToken.getAddressBalance(msg.sender) > threshold);
        _;
    }

    function setDIDTokenAddress(address _DIDTokenAddress) public onlyApproved {
        DIDTokenAddress = _DIDTokenAddress;
    }

    function setDistenseAddress(address _DistenseAddress) public onlyApproved {
        DistenseAddress = _DistenseAddress;
    }

    function setTasksAddress(address _TasksAddress) public onlyApproved {
        TasksAddress = _TasksAddress;
    }
}
