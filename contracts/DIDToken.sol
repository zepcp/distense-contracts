pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './Distense.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';

contract DIDToken is Token, Approvable {

    using SafeMath for uint256;

    event LogIssueDID(address indexed to, uint256 numDID);

    address public PullRequestsAddress;
    address public DistenseAddress;

    uint256 hardDIDFromEtherDepositLimitAggregate = 1000000;  // This is the max DID all addresses can receive from depositing ether
    uint256 hardDIDFromEtherDepositLimitAddress = 50000;  // This is the max DID any address can receive from Ether deposit
    uint256 totalDIDIssuedFromEtherDeposit = 0;

    mapping(address => uint256) public numDIDExchangedAddress;  // keep track of how much contributors have deposited to prevent over depositing

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
        return SafeMath.percent(owned, totalSupply, 3);
    }

    function exchangeDIDForEther(uint256 _numDIDToExchange)
        hasEnoughDID(msg.sender, _numDIDToExchange)
        external
    returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        //  Adjust number of DID owned first
        balances[msg.sender] = SafeMath.sub(balances[msg.sender], _numDIDToExchange);
        totalSupply = SafeMath.sub(totalSupply, _numDIDToExchange);

        totalDIDIssuedFromEtherDeposit + _numDIDToExchange;
        //  Send contributor their ether

        return balances[msg.sender];
    }

    function depositEtherForDID() canDepositThisManyEtherForDID(msg.sender, msg.value) external payable returns (uint256) {

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 numDIDToIssue = SafeMath.div(msg.value, DIDPerEther);

        totalSupply = SafeMath.add(totalSupply, numDIDToIssue);
        balances[msg.sender] = SafeMath.add(balances[msg.sender], numDIDToIssue);

        LogIssueDID(msg.sender, numDIDToIssue);

        return balances[msg.sender];
    }

    modifier hasEnoughDID(address _contributor, uint256 _num) {
        uint256 balance = balances[_contributor];
        require(balance >= _num);
        _;
    }

    modifier canDepositThisManyEtherForDID(address _contributor, uint256 _numEtherDepositing) {

        //  Make sure the aggregate limit of DID that can be issued for ether hasn't been reached
        require(totalDIDIssuedFromEtherDeposit < hardDIDFromEtherDepositLimitAggregate);
        require(numDIDExchangedAddress[msg.sender] < hardDIDFromEtherDepositLimitAddress);

        Distense distense = Distense(DistenseAddress);
        uint256 DIDPerEther = distense.getParameterValueByTitle(distense.didPerEtherParameterTitle());

        uint256 desiredNumberOfDIDToExchange = SafeMath.div(_numEtherDepositing, DIDPerEther);

        //  Each address is limited to exchanging hardDIDFromEtherDepositLimitForAddress number of DID
        //  This is the remaining number they may exchange.  Yes this is vuln to Sybil attacks
        uint256 numDIDCanExchange = SafeMath.sub(hardDIDFromEtherDepositLimitAddress, numDIDExchangedAddress[msg.sender]);

        require(desiredNumberOfDIDToExchange <= balances[msg.sender]);

        _;
    }

}
