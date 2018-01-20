pragma solidity ^0.4.17;

import './DIDToken.sol';
import './lib/SafeMath.sol';
import './Debuggable.sol';

contract Distense is Debuggable {
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

    Parameter public proposalPctDIDToApproveParameter;
    bytes32 public proposalPctDIDToApproveParameterTitle = 'proposalPctDIDToApprove';

    Parameter public pctDIDRequiredToMergePullRequest;
    bytes32 public pctDIDRequiredToMergePullRequestTitle = 'pctDIDRequiredToMergePullRequest';

    Parameter public votingIntervalParameter;
    bytes32 public votingIntervalParameterTitle = 'votingInterval';

    Parameter public maxRewardParameter;
    bytes32 public maxRewardParameterTitle = 'maxReward';

    Parameter public numDIDRequiredToApproveVotePullRequestParameter;
    bytes32 public numDIDRequiredToApproveVotePullRequestParameterTitle = 'numDIDReqApproveVotePullRequest';

    Parameter public numDIDRequiredToTaskRewardVoteParameter;
    bytes32 public numDIDRequiredToTaskRewardVoteParameterTitle = 'numDIDRequiredToTaskRewardVote';

    Parameter public minNumberOfTaskRewardVotersParameter;
    bytes32 public minNumberOfTaskRewardVotersParameterTitle = 'minNumberOfTaskRewardVoters';

    Parameter public defaultRewardParameter;
    bytes32 public defaultRewardParameterTitle = 'defaultReward';

    Parameter public didPerEtherParameter;
    bytes32 public didPerEtherParameterTitle = 'didPerEther';

    event LogParameterValueUpdate(bytes32 title, uint256 value);


    function Distense(address _DIDTokenAddress) public {

        DIDTokenAddress = _DIDTokenAddress;

        // Launch Distense with some votable parameters
        // that can be later updated by contributors
        // Current values can be found at https://disten.se/parameters

        // PCT of DID that must vote on a proposal for it to be approved and payable
        proposalPctDIDToApproveParameter = Parameter({
            title : proposalPctDIDToApproveParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     So this is 25.00%
            value : 2500
            });
        parameters[proposalPctDIDToApproveParameterTitle] = proposalPctDIDToApproveParameter;
        parameterTitles.push(proposalPctDIDToApproveParameterTitle);


        pctDIDRequiredToMergePullRequest = Parameter({
            title : pctDIDRequiredToMergePullRequestTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     So this is 10.00
            value : 1000
            });
        parameters[pctDIDRequiredToMergePullRequestTitle] = pctDIDRequiredToMergePullRequest;
        parameterTitles.push(pctDIDRequiredToMergePullRequestTitle);


        votingIntervalParameter = Parameter({
            title : votingIntervalParameterTitle,
            value : 129600000 // 15 * 86400 = 1.296e+6
            });
        parameters[votingIntervalParameterTitle] = votingIntervalParameter;
        parameterTitles.push(votingIntervalParameterTitle);


        maxRewardParameter = Parameter({
            title : maxRewardParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     So this is 5000.0
            value : 500000
            });
        parameters[maxRewardParameterTitle] = maxRewardParameter;
        parameterTitles.push(maxRewardParameterTitle);


        minNumberOfTaskRewardVotersParameter = Parameter({
            title : minNumberOfTaskRewardVotersParameterTitle,
            //     Every hard-coded int in Solidity is a decimal to one decimal place
            //     So this is 7.00
            value : 700
            });
        parameters[minNumberOfTaskRewardVotersParameterTitle] = minNumberOfTaskRewardVotersParameter;
        parameterTitles.push(minNumberOfTaskRewardVotersParameterTitle);


        // This parameter is the number of DID an account must own to vote on a task's reward
        // The task reward is the number of DID payable upon successful completion and approval of a task

        // This parameter mostly exists to get the percentage of DID that have voted higher per voter
        //   as looping through voters to determineReward()s is gas-expensive.

        // This parameter also limits attacks by noobs that want to mess with Distense.
        numDIDRequiredToTaskRewardVoteParameter = Parameter({
            title : numDIDRequiredToTaskRewardVoteParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            // 150.00
            value : 15000
            });
        parameters[numDIDRequiredToTaskRewardVoteParameterTitle] = numDIDRequiredToTaskRewardVoteParameter;
        parameterTitles.push(numDIDRequiredToTaskRewardVoteParameterTitle);


        numDIDRequiredToApproveVotePullRequestParameter = Parameter({
            title : numDIDRequiredToApproveVotePullRequestParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     200.00
            value : 20000
            });
        parameters[numDIDRequiredToApproveVotePullRequestParameterTitle] = numDIDRequiredToApproveVotePullRequestParameter;
        parameterTitles.push(numDIDRequiredToApproveVotePullRequestParameterTitle);


        defaultRewardParameter = Parameter({
            title : defaultRewardParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     100.00
            value : 10000
            });
        parameters[defaultRewardParameterTitle] = defaultRewardParameter;
        parameterTitles.push(defaultRewardParameterTitle);


        didPerEtherParameter = Parameter({
            title : didPerEtherParameterTitle,
            //     Every hard-coded int except for dates and numbers pertaining to ether or DID are decimals to two decimal places
            //     1000.00
            value : 100000
            });
        parameters[didPerEtherParameterTitle] = didPerEtherParameter;
        parameterTitles.push(didPerEtherParameterTitle);

    }

    function getParameterValueByTitle(bytes32 _title) public view returns (uint256) {
        return parameters[_title].value;
    }

    function voteOnParameter(bytes32 _title, int256 _voteValue)
        public
        votingIntervalReached(msg.sender, _title)
    returns
    (uint256) {

        DIDToken didToken = DIDToken(DIDTokenAddress);
        uint256 votersDIDPercent = didToken.pctDIDOwned(msg.sender);
        require(votersDIDPercent > 0);

        uint256 currentValue = getParameterValueByTitle(_title);

        votersDIDPercent = votersDIDPercent > 250 ? 250 : votersDIDPercent;

        uint256 update = (votersDIDPercent * currentValue) / 1000;

        if (_voteValue == 1)
            currentValue = SafeMath.add(currentValue, update);
        else
            currentValue = SafeMath.sub(currentValue, update);

        updateParameterValue(_title, currentValue);
        updateLastVotedOnParameter(_title, msg.sender);
        LogParameterValueUpdate(_title, currentValue);

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
        require(now >= lastVotedOnParameter + getParameterValueByTitle(votingIntervalParameterTitle));
        _;
    }

}
