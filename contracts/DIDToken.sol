pragma solidity ^0.4.21;

import './lib/Approvable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';

contract DIDToken is Approvable {

    using SafeMath for uint256;

    event LogIssueDID(address indexed to, uint256 numDID);
    event LogDecrementDID(address indexed to, uint256 numDID);
    event LogExchangeDIDForEther(address indexed to, uint256 numDID);
    event LogInvestEtherForDID(address indexed to, uint256 numWei);

    address[] public DIDHoldersArray;

    address public PullRequestsAddress;
    address public DistenseAddress;

    uint256 public investmentLimitAggregate  = 10000 ether;  // This is the max DID all addresses can receive from depositing ether
    uint256 public investmentLimitAddress = 100 ether;  // This is the max DID any address can receive from Ether deposit
    uint256 public investedAggregate = 0 ether;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    struct DIDHolder {
        uint256 balance;
        uint256 DIDHoldersIndex;
        uint256 weiInvested;
        uint256 tasksCompleted;
    }
    mapping (address => DIDHolder) public DIDHolders;

    function DIDToken() public {
        name = "Distense DID";
        symbol = "DID";
        totalSupply = 0;
        decimals = 18;
    }

    function issueDID(address _recipient, uint256 _numDID) external onlyApproved returns (uint256) {
        require(_recipient != address(0));
        require(_numDID > 0);

        totalSupply = SafeMath.add(totalSupply, _numDID);
        uint256 balance = DIDHolders[_recipient].balance;
        DIDHolders[_recipient].balance = SafeMath.add(balance, _numDID);

        if (DIDHolders[_recipient].DIDHoldersIndex == 0)
            DIDHolders[_recipient].DIDHoldersIndex = DIDHoldersArray.push(_recipient) - 1;

        emit LogIssueDID(_recipient, _numDID);

        return DIDHolders[_recipient].balance;
    }

    function decrementDID(address _address, uint256 _numDID) external onlyApproved returns (uint256) {
        require(_address != address(0));
        require(_numDID > 0);
        require(SafeMath.sub(DIDHolders[_address].balance, _numDID) >= 0);
        require(SafeMath.sub(totalSupply, _numDID) >= 0);

        totalSupply = SafeMath.sub(totalSupply, _numDID);
        DIDHolders[_address].balance = SafeMath.sub(DIDHolders[_address].balance, _numDID);
        //  If DIDHolder has exchanged all of their DID remove from DIDHoldersArray
        if (DIDHolders[_address].balance == 0) {
            if (DIDHoldersArray.length > 1) {
                address lastElement = DIDHoldersArray[DIDHoldersArray.length - 1];
                DIDHoldersArray[DIDHolders[_address].DIDHoldersIndex] = lastElement;
                DIDHoldersArray.length--;
                delete DIDHolders[msg.sender];
            }
        }

        emit LogDecrementDID(_address, _numDID);

        return DIDHolders[_address].balance;
    }

    function pctDIDOwned(address _address) external view returns (uint256) {
        return SafeMath.percent(DIDHolders[_address].balance, totalSupply, 4);
    }

    function exchangeDIDForEther(uint256 _numDIDToExchange)
        hasEnoughDID(msg.sender, _numDIDToExchange)
        external
    returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 numEtherToIssue = SafeMath.div(_numDIDToExchange, DIDPerEther);

        address contractAddress = this;
        require(contractAddress.balance > numEtherToIssue);

        //  Adjust number of DID owned first
        DIDHolders[msg.sender].balance = SafeMath.sub(DIDHolders[msg.sender].balance, _numDIDToExchange);
        totalSupply = SafeMath.sub(totalSupply, _numDIDToExchange);

        msg.sender.transfer(numEtherToIssue);

        if (DIDHolders[msg.sender].balance == 0) {
            if (DIDHoldersArray.length > 1) {
                address lastElement = DIDHoldersArray[DIDHoldersArray.length - 1];
                DIDHoldersArray[DIDHolders[msg.sender].DIDHoldersIndex] = lastElement;
                DIDHoldersArray.length--;
                delete DIDHolders[msg.sender];
            }
        }
        emit LogExchangeDIDForEther(msg.sender, _numDIDToExchange);

        return DIDHolders[msg.sender].balance;
    }

    function investEtherForDID() canDepositThisManyEtherForDID() external payable returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 numEtherInvested = SafeMath.div(msg.value, 1 ether);

        uint256 numDIDToIssue = SafeMath.mul(DIDPerEther, numEtherInvested);

        totalSupply = SafeMath.add(totalSupply, numDIDToIssue);
        DIDHolders[msg.sender].balance = SafeMath.add(DIDHolders[msg.sender].balance, numDIDToIssue);

        DIDHolders[msg.sender].weiInvested += msg.value;
        investedAggregate += msg.value;

        emit LogIssueDID(msg.sender, numDIDToIssue);
        emit LogInvestEtherForDID(msg.sender, msg.value);

        return DIDHolders[msg.sender].balance;
    }

    function incrementTasksCompleted(address _contributor) onlyApproved public returns (bool) {
        DIDHolders[_contributor].tasksCompleted++;
        return true;
    }

    function getNumWeiAddressMayInvest(address contributor) public view returns (uint256) {
        return SafeMath.sub(investmentLimitAddress, DIDHolders[contributor].weiInvested);
    }

    function getWeiAggregateMayInvest() public view returns (uint256) {
        return SafeMath.sub(investmentLimitAggregate, investedAggregate);
    }

    function getNumDIDHolders() external view returns (uint256) {
        return DIDHoldersArray.length;
    }

    function getAddressBalance(address _address) public view returns (uint256) {
        return DIDHolders[_address].balance;
    }

    function getWeiInvested(address _address) public view returns (uint256) {
        return DIDHolders[_address].weiInvested;
    }

    function setDistenseAddress(address _distenseAddress) public onlyApproved {
        DistenseAddress = _distenseAddress;
    }

    modifier hasEnoughDID(address _address, uint256 _num) {
        require(DIDHolders[_address].balance >= _num);
        _;
    }

    modifier canDepositThisManyEtherForDID() {
        uint256 numWeiMayInvest = getNumWeiAddressMayInvest(msg.sender);
        require(numWeiMayInvest >= msg.value);
        require(investedAggregate < investmentLimitAggregate);
        _;
    }



}
