pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';

contract DIDToken is Token, Approvable {

  using SafeMath for uint256;

  event LogIssueDID(address indexed to, uint256 numDID);

  address public PullRequestsAddress;

  uint256 hardDIDFromEtherDepositLimitInAggregate = 1000000;  // This is the max DID all addresses can receive from depositing ether
  uint256 hardDIDFromEtherDepositLimitForAddress = 50000;  // This is the max DID any address can receive from Ether deposit

  mapping (address => uint256) public numDIDExchanged;  // keep track of how much contributors have deposited to prevent over depositing

  function DIDToken (address _DistenseAddress) public payable {
    name = "Distense DID";
    symbol = "DID";

    DistenseAddress = _DistenseAddress;
  }

  function issueDID(address _recipient, uint256 _numDID) external onlyApproved returns (uint256) {
    require(_recipient != address(0));
    require(_numDID > 0);

    totalSupply = SafeMath.add(totalSupply, _numDID);
    balances[_recipient] = SafeMath.add(balances[_recipient], _numDID);
    LogIssueDID(_recipient, _numDID);

    return balances[_recipient];
  }
  
  function pctDIDOwned(address _person) external view returns (uint256) {
    uint owned = balances[_person];
    return SafeMath.percent(owned, totalSupply, 3);
  }

  function exchangeDIDForEther(uint256 _numDIDToExchange)
    hasEnoughDID(msg.sender, _numDIDToExchange) external returns
  (uint256) {

    Distense distense = Distense(DistenseAddress);
    uint256 DIDPerEther = Distense.getParameterValueByTitle(distense.didPerEtherParameterTitle);

    //  Adjust number of DID owned first
    balances[msg.sender] = SafeMath.sub(balances[msg.sender], _numDIDToExchange);
    totalSupply = SafeMath.sub(totalSupply, _numDIDToExchange);

    //  Send contributor their ether

    return balances[msg.sender];
  }

  modifier hasEnoughDID(address _contributor, uint256 num) {
    uint256 balance = balances(msg.sender);
    require(balance >= num);
    _;
  }

  function depositEtherForDID() canDepositThisManyEtherForDID(msg.sender, msg.value) external payable returns (uint256) {

    Distense distense = Distense(DistenseAddress);
    uint256 DIDPerEther = Distense.getParameterValueByTitle(distense.didPerEtherParameterTitle);

    uint256 numDIDToIssue = SafeMath.div(msg.value, DIDPerEther);

    totalSupply = SafeMath.add(totalSupply, numDIDToIssue);
    balances[_recipient] = SafeMath.add(balances[_recipient], numDIDToIssue);

    LogIssueDID(_recipient, _numDID);

    return balances[_recipient];
  }

  modifier hasEnoughDID(address _contributor, uint256 num) {
    uint256 balance = balances(msg.sender);
    require(balance >= num);
    _;
  }

  modifier canDepositThisManyEtherForDID(address _contributor, uint256 _numEtherDepositing) {

    uint256 balance = balances(msg.sender);
    require(balance >= num);

    uint256 numDIDExchanged = numDIDExchanged[msg.sender];
    Distense distense = Distense(DistenseAddress);
    uint256 DIDPerEther = Distense.getParameterValueByTitle(distense.didPerEtherParameterTitle);

    uint256 requiredNumDID = _numEtherDepositing / DIDPerEther;
    require(requiredNumDID >= balances[msg.sender]);

    _;
  }

}
