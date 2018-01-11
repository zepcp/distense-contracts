pragma solidity ^0.4.17;


contract Ownable {

  address public owner;

  function Ownable() internal {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

}