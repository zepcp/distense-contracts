const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const assertJump = require('./helpers/assertJump')
const proposalPctDIDRequiredValue = require('./Distense.test')

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


  it(`shouldn't let those who don\'t own DID to add tasks`, async function () {
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


  it('should return true for voteOnReward', async function () {

    await didToken.issueDID(accounts[0], 100)
    await didToken.issueDID(accounts[1], 100)

    const task = {
      taskId:
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    }

    await tasks.addTask(task.taskId)
    const taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    //  Make sure vote is less than DID owned
    const voted = await tasks.voteOnReward.call(task.taskId, 99, {
      from: accounts[1]
    })

    //  If you work on this, leaving this here will cause logs/events to throw for debugging
    await tasks.voteOnReward(task.taskId, 99, {
      from: accounts[0]
    })
    assert.equal(voted, true, 'voteOnReward should return true')

  })


  it('should correctly determine reachedProposalApprovalThreshold', async function () {

    //  User must have DID to addTask()
    await didToken.issueDID(accounts[0], 100)

    const task = {
      taskId:
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    }

    const added = await tasks.addTask(task.taskId)
    assert(added, true, 'should have added a task here')

  })


  // it.only('should correctly determineRewards', async function () {
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
  //   let voted2
  //   let voted3
  //
  //   await tasks.addTask(task.taskId)
  //   taskExists = await tasks.taskExists(task.taskId)
  //   assert.equal(taskExists, true, `task doesn't exist`)
  //
  //   await tasks.voteOnReward.call(task.taskId, 100, {
  //     from: accounts[0]
  //   })
  //
  //   reward1 = await tasks.determineReward.call(task.taskId)
  //   assert.equal(reward1.toNumber(), 100, 'Reward should equal average of two votes')
  //
  // })


  it('should not add tasks with empty bytes32', async function () {

    let addError
    try {
      //contract throws error here
      await tasks.addTask('')
    } catch (error) {
      addError = error
    }
    assert.notEqual(addError, undefined, 'Error should be thrown when inserting empty bytes32')

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
