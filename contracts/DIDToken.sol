pragma solidity ^0.4.17;

import './lib/Approvable.sol';
import './lib/SafeMath.sol';
import './lib/Token.sol';
import './Debuggable.sol';


contract DIDToken is Token, Approvable, Debuggable {

  using SafeMath for uint256;

  event LogIssueDID(address indexed to, uint256 numDID);

  function DIDToken () public {
    name = "Distense DID";
    symbol = "DID";
  }

  function issueDID(address _recipient, uint256 _numDID) external onlyApproved returns (uint256) {
    require(_recipient != address(0));
    require(_numDID > 0);

    totalSupply = totalSupply.add(_numDID);
    balances[_recipient] = balances[_recipient].add(_numDID);
    LogIssueDID(_recipient, _numDID);

    return balances[_recipient];
  }
  
  function pctDIDOwned(address person) external view returns (uint256) {
    uint owned = balances[person];
    return SafeMath.percent(owned, totalSupply, 3);
  }

}
