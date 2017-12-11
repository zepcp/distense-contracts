pragma solidity ^0.4.17;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DIDToken.sol";
import "../contracts/Tasks.sol";


contract TestTasks is Debuggable {

  Tasks tasks = new Tasks(
    DeployedAddresses.DIDToken(),
    DeployedAddresses.Distense()
  );

  DIDToken didToken = new DIDToken();

  bytes32 id = 0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9;

  function testGetNumTasks() public {

    uint256 numTasks = tasks.getNumTasks();
    Assert.equal(numTasks, 0, 'Should be a big fat 0 here');

  }


  function testGetTaskByIdAndDefaultTask()  public {

    var (by, reward, voters, paid, pct) = tasks.getTaskById(id);

    Assert.equal(reward, 0, 'reward initially 0');
    Assert.equal(voters, 0, 'no voters yet');
    Assert.equal(paid, false, 'not paid yet');
    Assert.equal(0, reward, 'pctDIDVoted should be 0');

  }

}

