pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';
import './Debuggable.sol';


contract DIDToken is Token, Approvable {

    using SafeMath for uint256;

    event LogIssueDID(address indexed to, uint256 numDID);
    event LogDecrementDID(address indexed to, uint256 numDID);
    event LogExchangeDIDForEther(address indexed to, uint256 numDID);
    event LogInvestEtherForDID(address indexed to, uint256 numWei);

    address public PullRequestsAddress;
    address public DistenseAddress;

    uint256 public investmentLimitAggregate  = 10000 ether;  // This is the max DID all addresses can receive from depositing ether
    uint256 public investmentLimitAddress = 500 ether;  // This is the max DID any address can receive from Ether deposit
    uint256 public investedAggregate = 0 ether;

    mapping(address => uint256) public investedAddress;  // keep track of how much contributors have deposited to prevent over depositing

    function DIDToken() public {
        name = "Distense DID";
        symbol = "DID";
    }

    function issueDID(address _recipient, uint256 _numDID) external onlyApproved returns (uint256) {
        require(_recipient != address(0));
        require(_numDID > 0);

        totalSupply = SafeMath.add(totalSupply, _numDID);
        balances[_recipient] = SafeMath.add(balances[_recipient], _numDID);
        LogIssueDID(_recipient, _numDID);

        return balances[_recipient];
    }

    function decrementDID(address _address, uint256 _numDID) external onlyApproved returns (uint256) {
        require(_address != address(0));
        require(_numDID > 0);
        require(SafeMath.sub(balances[_address], _numDID) >= 0);

        totalSupply = SafeMath.sub(totalSupply, _numDID);
        balances[_address] = SafeMath.sub(balances[_address], _numDID);
        LogDecrementDID(_address, _numDID);

        return balances[_address];
    }

    function pctDIDOwned(address _person) external view returns (uint256) {
        uint owned = balances[_person];
        return SafeMath.percent(owned, totalSupply, 4);
    }

    function exchangeDIDForEther(uint256 _numDIDToExchange)
        hasEnoughDID(msg.sender, _numDIDToExchange)
        external
    returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 numEtherToIssue = SafeMath.div(_numDIDToExchange, DIDPerEther);
        require(this.balance > numEtherToIssue);

        //  Adjust number of DID owned first
        balances[msg.sender] = SafeMath.sub(balances[msg.sender], _numDIDToExchange);
        totalSupply = SafeMath.sub(totalSupply, _numDIDToExchange);

        msg.sender.transfer(numEtherToIssue);
        LogExchangeDIDForEther(msg.sender, _numDIDToExchange);

        return balances[msg.sender];
    }

    function investEtherForDID() canDepositThisManyEtherForDID() external payable returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 numEtherInvested = SafeMath.div(msg.value, 1000000000000000000);

        uint256 numDIDToIssue = SafeMath.mul(DIDPerEther, numEtherInvested);

        totalSupply = SafeMath.add(totalSupply, numDIDToIssue);
        balances[msg.sender] = SafeMath.add(balances[msg.sender], numDIDToIssue);

        investedAddress[msg.sender] += msg.value;
        investedAggregate += msg.value;

        LogIssueDID(msg.sender, numDIDToIssue);
        LogInvestEtherForDID(msg.sender, msg.value);

        return balances[msg.sender];
    }

    function getNumWeiAddressMayInvest(address contributor) public view returns (uint256) {
        return investmentLimitAddress - investedAddress[contributor];
    }

    function getWeiAggregateMayInvest() public view returns (uint256) {
        return investmentLimitAggregate - investedAggregate;
    }

    function setDistenseAddress(address _distenseAddress) public onlyApproved {
        DistenseAddress = _distenseAddress;
    }

    modifier hasEnoughDID(address _contributor, uint256 _num) {
        uint256 balance = balances[_contributor];
        require(balance >= _num);
        _;
    }

    modifier canDepositThisManyEtherForDID() {
        uint256 numWeiMayInvest = getNumWeiAddressMayInvest(msg.sender);
        require(numWeiMayInvest >= msg.value);
        require(investedAggregate < investmentLimitAggregate);
        _;
    }



}
