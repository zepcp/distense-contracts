pragma solidity ^0.4.17;


contract Approvable {

    mapping(address => bool) public approved;

    function Approvable() public {
        approved[msg.sender] = true;
    }

    function approve(address _address) public onlyApproved {
        require(_address != address(0));
        approved[_address] = true;
    }

    function revokeApproval(address _address) public onlyApproved {
        require(_address != address(0));
        approved[_address] = false;
    }

    modifier onlyApproved() {
        require(approved[msg.sender]);
        _;
    }
}
