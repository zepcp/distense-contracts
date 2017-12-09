pragma solidity ^0.4.17;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Tasks.sol";


contract TestTasks {

  string taskId = '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9';
  bytes32 id = stringToBytes32(taskId);

  Tasks tasks = new Tasks(
    DeployedAddresses.DIDToken(),
    DeployedAddresses.Distense()
  );

  uint numTasks = tasks.getNumTasks();

  function testGetNumTasks() public {

    Assert.equal(numTasks, 0, 'Should be a big fat 0 here');

  }


  bool inserted = tasks.addTask(id);


  function testAddTask() public {

    Assert.equal(inserted, true, 'Should have inserted');

    uint numTasks = tasks.getNumTasks();
    Assert.equal(numTasks, 1, 'Should be 1 now');

  }


  function testGetTaskByIdAndDefaultTask()  public {

    var (by, reward, voters, paid, pct) = tasks.getTaskById(id);

    Assert.equal(reward, 0, 'reward initially 0');
    Assert.equal(voters, 0, 'no voters yet');
    Assert.equal(paid, false, 'not paid yet');
    Assert.equal(0, reward, 'pctDIDVoted should be 0');

  }


  function testTaskExists()  public {

    bool exists = tasks.taskExists(id);
    Assert.equal(exists, true, 'inserted task should exist');

  }


  function stringToBytes32(string source) public pure returns (bytes32 result) {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
      return 0x0;
    }

    assembly {
    result := mload(add(source, 32))
    }
  }
}

