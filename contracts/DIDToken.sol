pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';
import './Debuggable.sol';


contract DIDToken is Token, Approvable {

    using SafeMath for uint256;

    event LogIssueDID(address indexed to, uint256 numDID);
    event LogExchangeDIDForEther(address indexed to, uint256 numDID);
    event LogInvestEtherForDID(address indexed to, uint256 numEther);

    address public PullRequestsAddress;
    address public DistenseAddress;

    uint256 public numWeiAggregateMayInvest  = 10000 ether;  // This is the max DID all addresses can receive from depositing ether
    uint256 public numWeiAddressMayInvest   = 1000 ether;  // This is the max DID any address can receive from Ether deposit
    uint256 public weiInvestedAggregate = 0 ether;

    mapping(address => uint256) public numWeiInvestedAddress    ;  // keep track of how much contributors have deposited to prevent over depositing

    function DIDToken(address _DistenseAddress) public payable {
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

        numWeiInvestedAddress[msg.sender] += msg.value;
        weiInvestedAggregate += msg.value;

        LogIssueDID(msg.sender, numDIDToIssue);
        LogInvestEtherForDID(msg.sender, msg.value);

        return balances[msg.sender];
    }

    function numWeiContributorMayInvest(address contributor) public view returns (uint256) {
        return numWeiAddressMayInvest - numWeiInvestedAddress[contributor];
    }

    function remainingWeiAggregateMayInvest() public view returns (uint256) {
        return numWeiAggregateMayInvest - weiInvestedAggregate;
    }

    modifier hasEnoughDID(address _contributor, uint256 _num) {
        uint256 balance = balances[_contributor];
        require(balance >= _num);
        _;
    }

    modifier canDepositThisManyEtherForDID() {
        uint256 numWeiMayInvest = numWeiContributorMayInvest(msg.sender);
        require(numWeiMayInvest >= msg.value);
        require(weiInvestedAggregate < numWeiAggregateMayInvest);
        _;
    }



}
