pragma solidity ^0.4.21;

import './lib/Approvable.sol';
import './DIDToken.sol';
import './lib/SafeMath.sol';
import './Debuggable.sol';

contract Distense is Approvable, Debuggable {
    using SafeMath for uint256;

    address public DIDTokenAddress;

    /*
      Distense' votable parameters
      Parameter is the perfect word` for these: "a numerical or other measurable factor forming one of a set
      that defines a system or sets the conditions of its operation".
    */

    //  Titles are what uniquely identify parameters, so query by titles when iterating with clients
    bytes32[] public parameterTitles;

    struct Parameter {
        bytes32 title;
        uint256 value;
        mapping(address => Vote) votes;
    }

    struct Vote {
        address voter;
        uint256 lastVoted;
    }

    mapping(bytes32 => Parameter) public parameters;

    Parameter public votingIntervalParameter;
    bytes32 public votingIntervalParameterTitle = 'votingInterval';

    Parameter public pctDIDToDetermineTaskRewardParameter;
    bytes32 public pctDIDToDetermineTaskRewardParameterTitle = 'pctDIDToDetermineTaskReward';

    Parameter public pctDIDRequiredToMergePullRequest;
    bytes32 public pctDIDRequiredToMergePullRequestTitle = 'pctDIDRequiredToMergePullRequest';

    Parameter public maxRewardParameter;
    bytes32 public maxRewardParameterTitle = 'maxReward';

    Parameter public numDIDRequiredToApproveVotePullRequestParameter;
    bytes32 public numDIDRequiredToApproveVotePullRequestParameterTitle = 'numDIDReqApproveVotePullRequest';

    Parameter public numDIDRequiredToTaskRewardVoteParameter;
    bytes32 public numDIDRequiredToTaskRewardVoteParameterTitle = 'numDIDRequiredToTaskRewardVote';

    Parameter public minNumberOfTaskRewardVotersParameter;
    bytes32 public minNumberOfTaskRewardVotersParameterTitle = 'minNumberOfTaskRewardVoters';

    Parameter public numDIDRequiredToAddTaskParameter;
    bytes32 public numDIDRequiredToAddTaskParameterTitle = 'numDIDRequiredToAddTask';

    Parameter public defaultRewardParameter;
    bytes32 public defaultRewardParameterTitle = 'defaultReward';

    Parameter public didPerEtherParameter;
    bytes32 public didPerEtherParameterTitle = 'didPerEther';

    Parameter public votingPowerLimitParameter;
    bytes32 public votingPowerLimitParameterTitle = 'votingPowerLimit';

    event LogParameterValueUpdate(bytes32 title, uint256 value);

    function Distense(address _DIDTokenAddress) public {

        DIDTokenAddress = _DIDTokenAddress;

        // Launch Distense with some votable parameters
        // that can be later updated by contributors
        // Current values can be found at https://disten.se/parameters

        // Percentage of DID that must vote on a proposal for it to be approved and payable
        pctDIDToDetermineTaskRewardParameter = Parameter({
            title : pctDIDToDetermineTaskRewardParameterTitle,
            //     Every hard-coded int except for dates and numbers (not percentages) pertaining to ether or DID are decimals to two decimal places
            //     So this is 25.00%
            value: 25000000000
        });
        parameters[pctDIDToDetermineTaskRewardParameterTitle] = pctDIDToDetermineTaskRewardParameter;
        parameterTitles.push(pctDIDToDetermineTaskRewardParameterTitle);


        pctDIDRequiredToMergePullRequest = Parameter({
            title : pctDIDRequiredToMergePullRequestTitle,
            //     Every hard-coded int except for dates and numbers (not percentages) pertaining to ether or DID are decimals to two decimal places
            //     So this is 10.00
            value: 10000000000
        });
        parameters[pctDIDRequiredToMergePullRequestTitle] = pctDIDRequiredToMergePullRequest;
        parameterTitles.push(pctDIDRequiredToMergePullRequestTitle);


        votingIntervalParameter = Parameter({
            title : votingIntervalParameterTitle,
            value: 1296000000000000 // 15 * 86400 = 1.296e+6
        });
        parameters[votingIntervalParameterTitle] = votingIntervalParameter;
        parameterTitles.push(votingIntervalParameterTitle);


        maxRewardParameter = Parameter({
            title : maxRewardParameterTitle,
            //     Every hard-coded int except for dates and numbers (not percentages) pertaining to ether or DID are decimals to two decimal places
            //     So this is 5000.0
            value: 5000000000000
        });
        parameters[maxRewardParameterTitle] = maxRewardParameter;
        parameterTitles.push(maxRewardParameterTitle);


        numDIDRequiredToApproveVotePullRequestParameter = Parameter({
            title : numDIDRequiredToApproveVotePullRequestParameterTitle,
            //     Every hard-coded int except for dates and numbers (not percentages) pertaining to ether or DID are decimals to two decimal places
            //     200.00
            value: 200000000000
        });
        parameters[numDIDRequiredToApproveVotePullRequestParameterTitle] = numDIDRequiredToApproveVotePullRequestParameter;
        parameterTitles.push(numDIDRequiredToApproveVotePullRequestParameterTitle);


        // This parameter is the number of DID an account must own to vote on a task's reward
        // The task reward is the number of DID payable upon successful completion and approval of a task

        // This parameter mostly exists to get the percentage of DID that have voted higher per voter
        //   as looping through voters to determineReward()s is gas-expensive.

        // This parameter also limits attacks by noobs that want to mess with Distense.
        numDIDRequiredToTaskRewardVoteParameter = Parameter({
            title : numDIDRequiredToTaskRewardVoteParameterTitle,
            // 100.00
            value: 100000000000
        });
        parameters[numDIDRequiredToTaskRewardVoteParameterTitle] = numDIDRequiredToTaskRewardVoteParameter;
        parameterTitles.push(numDIDRequiredToTaskRewardVoteParameterTitle);


        minNumberOfTaskRewardVotersParameter = Parameter({
            title : minNumberOfTaskRewardVotersParameterTitle,
            //     So this is 7.00
            value: 7000000000
        });
        parameters[minNumberOfTaskRewardVotersParameterTitle] = minNumberOfTaskRewardVotersParameter;
        parameterTitles.push(minNumberOfTaskRewardVotersParameterTitle);


        numDIDRequiredToAddTaskParameter = Parameter({
            title : numDIDRequiredToAddTaskParameterTitle,
            //     So this is 100.00
            value: 100000000000
        });
        parameters[numDIDRequiredToAddTaskParameterTitle] = numDIDRequiredToAddTaskParameter;
        parameterTitles.push(numDIDRequiredToAddTaskParameterTitle);


        defaultRewardParameter = Parameter({
            title : defaultRewardParameterTitle,
            //     100.00
            value: 100000000000
        });
        parameters[defaultRewardParameterTitle] = defaultRewardParameter;
        parameterTitles.push(defaultRewardParameterTitle);


        didPerEtherParameter = Parameter({
            title : didPerEtherParameterTitle,
            //     1000.00
            value: 1000000000000
        });
        parameters[didPerEtherParameterTitle] = didPerEtherParameter;
        parameterTitles.push(didPerEtherParameterTitle);

        votingPowerLimitParameter = Parameter({
            title : votingPowerLimitParameterTitle,
            //     20.00%
            value: 20000000000
        });
        parameters[votingPowerLimitParameterTitle] = votingPowerLimitParameter;
        parameterTitles.push(votingPowerLimitParameterTitle);

    }

    function getParameterValueByTitle(bytes32 _title) public view returns (uint256) {
        return parameters[_title].value;
    }

    /**
        Function called when contributors vote on parameters at /parameters url
        In the client there are: max and min buttons and a text input

        @param _title name of parameter title the DID holder is voting on.  This must be one of the hardcoded titles in this file.
        @param _voteValue integer in percentage effect.  For example if the current value of a parameter is 20, and the voter votes 24, _voteValue
        would be 20, for a 20% increase.

        If _voteValue is 1 it's a max upvote, if -1 max downvote. Maximum votes, as just mentioned, affect parameter values by
        max(percentage of DID owned by the voter, value of the votingLimit parameter).
        If _voteValue has a higher absolute value than 1, the user has voted a specific value not maximum up or downvote.
        In that case we update the value to the voted value if the value would affect the parameter value less than their percentage DID ownership.
          If they voted a value that would affect the parameter's value by more than their percentage DID ownership we affect the value by their percentage DID ownership.
    */
    function voteOnParameter(bytes32 _title, int256 _voteValue)
        public
        votingIntervalReached(msg.sender, _title)
        returns
    (uint256) {

        require(_voteValue <= 100);

        DIDToken didToken = DIDToken(DIDTokenAddress);
        uint256 votersDIDPercent = didToken.pctDIDOwned(msg.sender);
        require(votersDIDPercent > 0);

        uint256 currentValue = getParameterValueByTitle(_title);
//          For voting power purposes, limit the pctDIDOwned to the maximum of the Voting Power Limit parameter or the voter's percentage ownership
//          of DID
        uint256 votingPowerLimit = getParameterValueByTitle(votingPowerLimitParameterTitle);

        uint256 limitedVotingPower = votersDIDPercent > votingPowerLimit ? votingPowerLimit : votersDIDPercent;

        uint256 update;
        if (
            _voteValue == 1 ||  // maximum upvote
            _voteValue == - 1 || // minimum downvote
            _voteValue * 1000000000 > int(limitedVotingPower) ||
            _voteValue * - 1000000000 > int(limitedVotingPower)
        ) {
            update = (limitedVotingPower * currentValue) / 100000000000;
        } else if (_voteValue > 0) {
            update = (uint(_voteValue) * currentValue) / 100;
        } else if (_voteValue < 0) {
            int256 adjustedVoteValue = (-_voteValue) * 1000000000; // make the voteValue positive and convert to on-chain decimals
            update = uint((adjustedVoteValue * int(currentValue)) / 100000000000);
        } else revert(); //  If _voteValue is 0 refund gas to voter

        if (_voteValue > 0)
            currentValue = SafeMath.add(currentValue, update);
        else
            currentValue = SafeMath.sub(currentValue, update);

        updateParameterValue(_title, currentValue);
        updateLastVotedOnParameter(_title, msg.sender);
        emit LogParameterValueUpdate(_title, currentValue);

        return currentValue;
    }

    function getParameterByTitle(bytes32 _title) public view returns (bytes32, uint256) {
        Parameter memory param = parameters[_title];
        return (param.title, param.value);
    }

    function getNumParameters() public view returns (uint256) {
        return parameterTitles.length;
    }

    function updateParameterValue(bytes32 _title, uint256 _newValue) internal returns (uint256) {
        Parameter storage parameter = parameters[_title];
        parameter.value = _newValue;
        return parameter.value;
    }

    function updateLastVotedOnParameter(bytes32 _title, address voter) internal returns (bool) {
        Parameter storage parameter = parameters[_title];
        parameter.votes[voter].lastVoted = now;
    }

    modifier votingIntervalReached(address _voter, bytes32 _title) {
        Parameter storage parameter = parameters[_title];
        uint256 lastVotedOnParameter = parameter.votes[_voter].lastVoted;
        require(now * 1000000000 >= lastVotedOnParameter + getParameterValueByTitle(votingIntervalParameterTitle));
        _;
    }

    function setDIDTokenAddress(address _didTokenAddress) public onlyApproved {
        DIDTokenAddress = _didTokenAddress;
    }

}
