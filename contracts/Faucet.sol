pragma solidity ^0.4.19;

contract Faucet {

    event SendEther(address receiver);

    mapping(address => uint256) lastRequested;

    uint256 lastPaid = now;
    function Faucet() public {

    }

    function requestEther() public returns (bool) {
        if (
            msg.sender.balance < 5 ether &&
            (
                now > (lastRequested[msg.sender] + 30 minutes) ||
                lastRequested[msg.sender] == 0
            ) &&
            now > lastPaid + 10 seconds
        ) {
            SendEther(msg.sender);
            msg.sender.transfer(10 ether);
            lastRequested[msg.sender] = now;
            lastPaid = now;
            return true;
        } else return false;
    }

    function () public payable {

    }
}
