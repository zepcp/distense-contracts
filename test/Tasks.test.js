const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const assertJump = require('./helpers/assertJump')

contract('Tasks', function (accounts) {
  beforeEach(async function () {
    didToken = await DIDToken.new()
    distense = await Distense.new(didToken.address)
    tasks = await Tasks.new(didToken.address, distense.address)
  })

  const task = {
    taskId:
      '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
  }

  it('should set the initial external addresses correctly', async function () {
    const didAddress = await tasks.DIDTokenAddress.call()
    assert.notEqual(didAddress, undefined, 'DIDTokenAddress not set')

    const distenseAddress = await tasks.DistenseAddress()
    assert.notEqual(distenseAddress, undefined, 'DistenseAddress not set')
    // assert.equal(await tasks.getNumTasks(), 0, 'Initial numTasks should be 0')
  })

  it('should let those who own DID add tasks', async function () {
    await didToken.issueDID(accounts[0], 1234)
    //  addTask from default accounts[0]
    await tasks.addTask(
      '0x956761ab87f7b984dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    )
    let numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 1, 'numTasks should be 1')
  })

  it('should let those who don\'t own DID to add tasks', async function () {
    let addError

    try {

      const userBalance = await didToken.balances.call(accounts[1])
      assert.equal(userBalance, 0, `user's DID balance should be 0 here`)

      await tasks.addTask(
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
        {
          from: accounts[1] // accounts[1] has no DID
        }
      )
    } catch (error) {
      addError = error
    }
    assert.notEqual(addError, undefined, 'Error must be thrown when user with no DID addTasks()s')

    const numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 0, 'numTasks should still be 0')
  })

  // var events = tasks.allEvents();
  //
  // events.watch(function (error, event) {
  //   if (error) console.log(`error: ${error}`)
  //   else console.log(web3.fromHexString(event.args))
  // });


  it('should correctly return the number of DID owned by the first 50 voters on a task reward', async function  () {

    await didToken.issueDID(accounts[0], 100)
    await didToken.issueDID(accounts[1], 200)

    let taskExists
    await tasks.addTask(task.taskId)
    taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    await tasks.voteOnReward(task.taskId, 50, {
      from: accounts[0]
    })

    let numDIDVoted
    numDIDVoted = await tasks.numDIDVotedOnTask.call(task.taskId)

    assert.equal(numDIDVoted, 100, '100 DID have voted here')
    await tasks.voteOnReward(task.taskId, 99, {
      from: accounts[1]
    })

    numDIDVoted = await tasks.numDIDVotedOnTask.call(task.taskId)
    assert.equal(numDIDVoted, 300, '300 DID have voted here')
  })


  it('should return true for voteOnReward', async function () {

    await didToken.issueDID(accounts[0], 100)
    await didToken.issueDID(accounts[1], 100)

    const task = {
      taskId:
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    }

    let reward1
    let reward2
    let taskExists

    await tasks.addTask(task.taskId)
    taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    await tasks.voteOnReward(task.taskId, 99, {
      from: accounts[0]
    })

    const voted = await tasks.voteOnReward.call(task.taskId, 99, {
      from: accounts[1]
    })
    assert.equal(voted, true, 'voteOnReward should return true')
    // assert.equal(true, false, 'DISREGARD THIS ERROR it is only there cause the debug/log events to print')
  })

  it('should correctly determine the percentDIDVoted', async function  () {

    let determineReward
    await didToken.issueDID(accounts[0], 100)
    await didToken.issueDID(accounts[1], 200)

    const task = {
      taskId:
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    }

    let reward1
    let reward2
    let taskExists
    let percentDIDVoted

    await tasks.addTask(task.taskId)
    taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, `task doesn't exist`)

    const voted = await tasks.voteOnReward(task.taskId, 100, {
      from: accounts[0]
    })
    assert.equal(true, false, 'DISREGARD THIS ERROR it is only there cause the debug/log events to print')
    // assert.equal(voted, true, 'should have returned true from voteOnReward')

    // percentDIDVoted = await tasks.percentDIDVoted.call(task.taskId)
    // assert.equal(percentDIDVoted.toNumber(), 333, 'percentDIDVoted should be 333 here')

    // assert.equal(true, false, 'DISREGARD THIS ERROR it is only there cause the debug/log events to print')
    // await didToken.issueDID(accounts[3], 300)
    // await tasks.voteOnReward(task.taskId, 100, {
    //   from: accounts[3]
    // })
    // percentDIDVoted = await tasks.percentDIDVoted(task.taskId)
    // assert.equal(percentDIDVoted.toNumber(), 667, 'percentDIDVoted should be 667')
    //
    // await didToken.issueDID(accounts[4], 300)
    // await tasks.voteOnReward(task.taskId, 100, {
    //   from: accounts[4]
    // })
    // percentDIDVoted = await tasks.percentDIDVoted(task.taskId)
    // assert.equal(percentDIDVoted.toNumber(), 778, 'percentDIDVoted should be 778')
  })



  // it/*.only*/('should correctly determineRewards', async function () {
  //
  //   // var events = tasks.allEvents();
  //   //
  //   // events.watch(function(error, event){
  //   //   if (error) console.log(`error: ${error}`);
  //   //     else console.log(event.args)
  //   // });
  //   //
  //   // let logEventListener = tasks.LogUInt256()
  //
  //   let determineReward
  //
  //   await didToken.issueDID(accounts[0], 150)
  //   await didToken.issueDID(accounts[1], 150)
  //   await didToken.issueDID(accounts[2], 900)
  //
  //   const task = {
  //     taskId:
  //       '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
  //   }
  //
  //   let reward1
  //   let reward2
  //   let taskExists1
  //   let voted1
  //   let voted2
  //   let voted3
  //
  //   try {
  //     await tasks.addTask(task.taskId)
  //     taskExists1 = await tasks.taskExists(task.taskId)
  //
  //     voted1 = await tasks.voteOnReward.call(task.taskId, 100, {
  //       from: accounts[0]
  //     })
  //
  //     voted2 = await tasks.voteOnReward.call(task.taskId, 100, {
  //       from: accounts[1]
  //     })
  //
  //     reward1 = await tasks.determineReward.call(task.taskId)
  //
  //     //  accounts[2] now owns 75% of total DID
  //     voted3 = await tasks.voteOnReward.call(task.taskId, 800, {
  //       from: accounts[2]
  //     })
  //
  //     reward2 = await tasks.determineReward.call(task.taskId)
  //
  //   } catch (error) {
  //     determineReward = error
  //   }
  //
  //   // let loggedUInt = await logEventListener.get()
  //
  //   // let eventArgs = loggedUInt[0].args
  //   // console.log(`first int: ${eventArgs.someInt}`)
  //   // const secInt = loggedUInt[1].args
  //   // console.log(`second int: ${secInt.someInt}`)
  //
  //   assert.equal(taskExists1, true)
  //   assert.equal(voted1, true, 'voted1 should be true')
  //   assert.equal(voted2, true, 'voted2 should be true')
  //   assert.equal(reward1.toNumber(), 100, 'Reward should equal average of two votes')
  //   assert.equal(voted3, true, 'voted3 should be true')
  //   assert.equal(reward2.toNumber(), 625, 'Reward should equal weighted average of three votes')
  // })



  it('should not add tasks with ipfsHashes that are empty strings', async function () {
    let addError
    try {
      //contract throws error here
      await tasks.addTask('')
    } catch (error) {
      addError = error
    }
    assert.notEqual(addError, undefined, 'Error must be thrown')

    const numTasks = await tasks.getNumTasks.call()
    assert.equal(
      numTasks,
      0,
      'No task should be added when empty string passed'
    )
  })

  /* EVENTS */


  it('should fire event \'LogAddTask\' when addTask is called', async function () {
    let LogAddTaskEventListener = tasks.LogAddTask()

    await didToken.issueDID(accounts[0], 1)
    const taskId =
      '0x956761ab87f7b984dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    await tasks.addTask(taskId)

    let addTaskLog = await new Promise((resolve, reject) =>
      LogAddTaskEventListener.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    let eventArgs = addTaskLog[0].args
    assert.equal(eventArgs.taskId, taskId)
    assert.equal(addTaskLog.length, 1, 'should be 1 event')
  })

})
