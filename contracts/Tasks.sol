pragma solidity ^0.4.17;

import './DIDToken.sol';
import './Distense.sol';
import './lib/SafeMath.sol';


contract Tasks is Approvable, Debuggable {

    using SafeMath for uint256;

    address public DIDTokenAddress;
    address public DistenseAddress;
    address public PullRequestsAddress;

    bytes32[] public taskIds;

    enum RewardStatus {TENTATIVE, DETERMINED, PAID}

    struct Task {
        string title;
        address createdBy;
        uint256 reward;
        RewardStatus rewardStatus;
        uint256 pctDIDVoted;
        uint64 numVotes;
        mapping(address => bool) rewardVotes;
        uint256 taskIdsIndex;   // for easy later deletion to minimize query time and blockchain size
    }

    mapping(bytes32 => Task) tasks;

    event LogAddTask(bytes32 taskId, string title);
    event LogTaskRewardVote(bytes32 taskId, uint256 reward, uint256 pctDIDVoted);
    event LogTaskRewardDetermined(bytes32 taskId, uint256 reward);

    function Tasks(address _DIDTokenAddress, address _DistenseAddress) public {
        DIDTokenAddress = _DIDTokenAddress;
        DistenseAddress = _DistenseAddress;
    }

    function addTask(bytes32 _taskId, string _title) external hasEnoughDIDToAddTask() returns
    (bool) {

        Distense distense = Distense(DistenseAddress);

        tasks[_taskId].createdBy = msg.sender;
        tasks[_taskId].title = _title;
        tasks[_taskId].reward = distense.getParameterValueByTitle(distense.defaultRewardParameterTitle());
        tasks[_taskId].rewardStatus = RewardStatus.TENTATIVE;

        taskIds.push(_taskId);
        tasks[_taskId].taskIdsIndex = taskIds.length - 1;
        LogAddTask(_taskId, _title);

        return true;

    }

    function getTaskById(bytes32 _taskId) external view returns (
        string,
        address,
        uint256,
        Tasks.RewardStatus,
        uint256,
        uint64
    ) {

        Task memory task = tasks[_taskId];
        return (
            task.title,
            task.createdBy,
            task.reward,
            task.rewardStatus,
            task.pctDIDVoted,
            task.numVotes
        );

    }

    function taskExists(bytes32 _taskId) external view returns (bool) {
        return tasks[_taskId].createdBy != 0;
    }

    function getNumTasks() external view returns (uint256) {
        return taskIds.length;
    }

    function taskRewardVote(bytes32 _taskId, uint256 _reward) external returns (bool) {

        DIDToken didToken = DIDToken(DIDTokenAddress);
        uint256 balance = didToken.balances(msg.sender);
        Distense distense = Distense(DistenseAddress);

        Task storage task = tasks[_taskId];

        require(_reward >= 0);

        //  Essentially refund the remaining gas if user's vote will have no effect
        require(task.reward != _reward);

        require(task.rewardStatus != RewardStatus.DETERMINED);

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

        //  Get the current votingPowerLimit
        uint256 votingPowerLimit = distense.getParameterValueByTitle(distense.votingPowerLimitParameterTitle());
        //  For voting purposes, limit the pctDIDOwned
        uint256 limitedVotingPower = pctDIDOwned > votingPowerLimit ? votingPowerLimit : pctDIDOwned;

        uint256 difference;
        uint256 update;
        if (_reward > task.reward) {
            difference = SafeMath.sub(_reward, task.reward);
            update = (limitedVotingPower * difference) / 10000;
            task.reward += update;
        } else {
            difference = SafeMath.sub(task.reward, _reward);
            update = (limitedVotingPower * difference) / 10000;
            task.reward -= update;
        }

        task.numVotes++;

        uint256 pctDIDVotedThreshold = distense.getParameterValueByTitle(
            distense.pctDIDToDetermineTaskRewardParameterTitle()
        );

        uint256 minNumVoters = distense.getParameterValueByTitle(
            distense.minNumberOfTaskRewardVotersParameterTitle()
        );

        if (task.pctDIDVoted > pctDIDVotedThreshold || task.numVotes > minNumVoters) {
            LogTaskRewardDetermined(_taskId, task.reward);
            task.rewardStatus = RewardStatus.DETERMINED;
        }

        return true;

    }

    function getTaskReward(bytes32 _taskId) external view returns (uint256) {
        return tasks[_taskId].reward;
    }

    function getTaskRewardAndStatus(bytes32 _taskId) external view returns (uint256, RewardStatus) {
        return (
            tasks[_taskId].reward,
            tasks[_taskId].rewardStatus
        );
    }

    function setTaskRewardPaid(bytes32 _taskId) external onlyApproved returns (RewardStatus) {
        tasks[_taskId].rewardStatus = RewardStatus.PAID;
        return tasks[_taskId].rewardStatus;
    }

    //  Allow deleting of PAID taskIds to minimize blockchain size & query time on client
    //  taskIds are memorialized in the form of events/logs, so this doesn't truly delete them,
    //  it just prevents them from slowing down query times
    function deleteTask(bytes32 _taskId) external onlyApproved returns (bool) {
        Task storage task = tasks[_taskId];

        if (task.rewardStatus == RewardStatus.PAID) {
            uint256 index = tasks[_taskId].taskIdsIndex;
            delete taskIds[index];
            delete tasks[_taskId];

            // Move the last element to the deleted index.  If we don't do this there are no efficiencies and the index will still still be
            // iterated over on the client
            uint256 taskIdsLength = taskIds.length;
            if (taskIdsLength > 1) {
                bytes32 lastElement = taskIds[taskIdsLength - 1];
                taskIds[index] = lastElement;
                taskIds.length--;
            }
            return true;
        }
        return false;
    }

    modifier hasEnoughDIDToAddTask() {
        DIDToken didToken = DIDToken(DIDTokenAddress);
        uint256 balance = didToken.balances(msg.sender);

        Distense distense = Distense(DistenseAddress);
        uint256 numDIDRequiredToAddTask = distense.getParameterValueByTitle(
            distense.numDIDRequiredToAddTaskParameterTitle()
        );
        numDIDRequiredToAddTask = SafeMath.div(numDIDRequiredToAddTask, 100);
        require(balance >= numDIDRequiredToAddTask);
        _;
    }


}
