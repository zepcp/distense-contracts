pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';

contract DIDToken is Token, Approvable {

  using SafeMath for uint256;

  event LogIssueDID(address indexed to, uint256 numDID);

  address public PullRequestsAddress;

  function DIDToken () public {
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
  
  function pctDIDOwned(address person) external view returns (uint256) {
    uint owned = balances[person];
    return SafeMath.percent(owned, totalSupply, 4);
  }

}
