pragma solidity ^0.4.15;


contract Ownable {

  address public owner;

  function Ownable() internal {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address _newOwner) external onlyOwner {
    require(_newOwner != address(0));
    owner = _newOwner;
  }
}