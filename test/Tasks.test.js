const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const assertJump = require('./helpers/assertJump')

contract('Tasks', function(accounts) {
  beforeEach(async function() {
    didToken = await DIDToken.new()
    distense = await Distense.new(didToken.address)
    tasks = await Tasks.new(didToken.address, distense.address)
  })

  it('should set the initial external addresses correctly', async function() {
    const didAddress = await tasks.DIDTokenAddress.call()
    assert.notEqual(didAddress, undefined, 'DIDTokenAddress not set')

    const distenseAddress = await tasks.DistenseAddress()
    assert.notEqual(distenseAddress, undefined, 'DistenseAddress not set')
    // assert.equal(await tasks.getNumTasks(), 0, 'Initial numTasks should be 0')
  })

  it('should let those who own DID add tasks', async function() {
    await didToken.issueDID(accounts[0], 1234)
    //  addTask from default accounts[0]
    await tasks.addTask(
      '0x956761ab87f7b984dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    )
    let numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 1, 'numTasks should be 1')
  })

  it("should let those who don't own DID to add tasks", async function() {
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


  it('should correctly determineReward()s', async function() {
    let determineReward

    await didToken.issueDID(accounts[0], 150)
    await didToken.issueDID(accounts[1], 150)
    await didToken.issueDID(accounts[2], 900)

    const task = {
      taskId:
        '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
    }

    let reward1
    let reward2
    let taskExists1
    let voted1
    let voted2
    let voted3
    try {
      await tasks.addTask(task.taskId)
      taskExists1 = await tasks.taskExists(task.taskId)

      voted1 = await tasks.voteOnReward.call(task.taskId, 100, {
        from: accounts[0]
      })

      voted2 = await tasks.voteOnReward.call(task.taskId, 100, {
        from: accounts[1]
      })

      reward1 = await tasks.determineReward.call(task.taskId)

      //  accounts[2] now owns 75%
      voted3 = await tasks.voteOnReward.call(task.taskId, 800, {
        from: accounts[2]
      })

      reward2 = await tasks.determineReward.call(task.taskId)

    } catch (error) {
      determineReward = error
    }

    assert.equal(taskExists1, true)
    assert.equal(voted1, true, 'voted1 should be true')
    assert.equal(voted2, true, 'voted2 should be true')
    assert.equal(reward1.toNumber(), 100, 'Reward should equal average of two votes')
    assert.equal(voted3, true, 'voted3 should be true')
    assert.equal(reward2.toNumber(), 625, 'Reward should equal weighted average of three votes')
  })


  it('should not add tasks with ipfsHashes that are empty strings', async function() {
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


  it("should fire event 'LogAddTask' when addTask is called", async function() {
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
