pragma solidity ^0.4.17;

import './DIDToken.sol';
import './lib/SafeMath.sol';

contract Distense {
  using SafeMath for uint256;

  address public DIDTokenAddress;

  /*
    Distense' votable parameters
    Parameter is the perfect word for these: "a numerical or other measurable factor forming one of a set
    that defines a system or sets the conditions of its operation".
  */

  //  Titles are what uniquely define parameters, so query by titles when iterating with client
  bytes32[] public parameterTitles;
  struct Parameter {
    bytes32 title;
    uint256 value;
    mapping (address => Vote) votes;
  }
  struct Vote {
    address voter;
    uint256 lastVoted;
  }

  mapping (bytes32 => Parameter) public parameters;

  Parameter public proposalPctDIDApprovalParameter;
  bytes32 public proposalPctDIDApprovalTitle = 'proposalPctDIDRequired';


  Parameter public pullRequestPctDIDParameter;
  bytes32 public pullRequestPctDIDRequiredParameterTitle = 'pullRequestPctDIDRequired';
  uint256 public votingInterval;  // Period of time between when voters can update these Distense parameters


  Parameter public votingIntervalParameter;
  bytes32 public votingIntervalParameterTitle = 'votingInterval';

  Parameter public maxRewardParameter;
  bytes32 public maxRewardParameterTitle = 'maxReward';

  event LogParameterValueUpdate(bytes32 title, uint256 value);

  function Distense(address _DIDTokenAddress) public {

    DIDToken didToken = DIDToken(_DIDTokenAddress);

    // Launch Distense with some votable parameters that can be later updated by contributors
    proposalPctDIDApprovalParameter = Parameter({
      title: proposalPctDIDApprovalTitle,
      value: 25
    });
    parameters[proposalPctDIDApprovalTitle] = proposalPctDIDApprovalParameter;
    parameterTitles.push(proposalPctDIDApprovalTitle);

    pullRequestPctDIDParameter = Parameter({
      title: pullRequestPctDIDRequiredParameterTitle,
      value: 10
    });
    parameters[pullRequestPctDIDRequiredParameterTitle] = pullRequestPctDIDParameter;
    parameterTitles.push(pullRequestPctDIDRequiredParameterTitle);
    
    votingIntervalParameter = Parameter({
      title: votingIntervalParameterTitle,
      value: 15 days  // 15 * 86400 = 1.296e+6
    });
    parameters[votingIntervalParameterTitle] = votingIntervalParameter;
    parameterTitles.push(votingIntervalParameterTitle);

    maxRewardParameter = Parameter({
      title: maxRewardParameterTitle,
      value: 1000
    });
    parameters[maxRewardParameterTitle] = maxRewardParameter;
    parameterTitles.push(maxRewardParameterTitle);

  }
  
  function getParameterValue(bytes32 _title) public view returns (uint256) {
     return parameters[_title].value; 
  }

  function voteOnParameter(bytes32 _title, uint256 _voteValue )
    public
    voteWithinRange(_title, _voteValue )
    votingIntervalReached(msg.sender, _title)
  returns
    (uint256) {

    DIDToken didToken = DIDToken(DIDTokenAddress);
    uint256 votersDIDPercent = didToken.percentDID(msg.sender);
    require (votersDIDPercent > 0);

    uint256 currentValue = getParameterValue(_title);
    require(_voteValue != currentValue);

    uint updatedValue = (_voteValue * votersDIDPercent) / 100;

    updateParameterValue(_title, updatedValue);
    updateLastVotedOnParameter(_title, msg.sender);
    LogParameterValueUpdate(_title, updatedValue);
    return updatedValue;
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
    if (lastVotedOnParameter > 0)
      require(now >= lastVotedOnParameter + votingInterval);
    _;
  }

  modifier voteWithinRange(bytes32 _title, uint256 _newValue) {
    Parameter storage parameter = parameters[_title];
    uint256 currentValue = parameter.value;
    require(_newValue >= 0);
    require(_newValue <= 2 * currentValue);
    _;
  }

}
