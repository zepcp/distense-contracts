const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const assertJump = require('./helpers/assertJump')
const proposalPctDIDRequiredValue = require('./Distense.test')


const convertIntToSolidityInt = function (integer) {
  return integer * 10
}

const convertSolidityIntToInt = function (integer) {
  return integer / 10
}

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

  const taskTwo = {
    taskId:
      '0x8546123ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
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
      task.taskId
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


  it.only('should return true or otherwise modify the task with taskRewardVote() when the voter hasDID', async function () {

    await didToken.issueDID(accounts[0], convertIntToSolidityInt(1000))
    await didToken.issueDID(accounts[1], convertIntToSolidityInt(1000))

    await tasks.addTask(task.taskId)
    const taskExists = await tasks.taskExists.call(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    //  Make sure vote is less than DID owned
    await tasks.taskRewardVote(task.taskId, 50, {
      from: accounts[1]
    })

    const taskDiffThanInitial = await tasks.getTaskById.call(task.taskId)
    assert.isAbove(taskDiffThanInitial[3].toNumber(), 0, 'task pctDIDVoted should be greater than 0')

  })


  it('should return false when someone tries to vote twice', async function () {

    const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
    const maxDIDRewardValue = await distense.getParameterValueByTitle.call(maxRewardParameterTitle)

    await didToken.issueDID(accounts[0], 10000)

    await tasks.addTask(task.taskId)

    //  Make sure vote is less than DID owned
    const voted = await tasks.taskRewardVote(task.taskId, maxDIDRewardValue - 1, {
      from: accounts[0]
    })

    const testTask = await tasks.getTaskById.call(task.taskId)

    assert.equal(testTask[3].toNumber(), 1000, 'task.pctDIDVoted should equal the pctDIDVoted by the first voter')

  })


  it('should return false when someone tries to vote on a task for for a reward that is greater than the number of DID they own', async function () {

    const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
    const maxDIDRewardValue = await distense.getParameterValueByTitle.call(maxRewardParameterTitle)

    const didOwnedByVoter = 50
    await didToken.issueDID(accounts[0], didOwnedByVoter)

    assert.isBelow(didOwnedByVoter, maxDIDRewardValue, 'Make sure voter will not accidentally trip a the higher than maxDIDReward parameter value')

    await tasks.addTask(task.taskId)
    const taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    //  Voter is voting for more than the DID they have
    let voted = await tasks.taskRewardVote.call(task.taskId, didOwnedByVoter + 1, {
      from: accounts[0]
    })
    assert.equal(voted, false, `Reject votes for rewards greater than the number of DID someone owns`)

    // Voter is now voting for how much DID they own minus 1
    voted = await tasks.taskRewardVote.call(task.taskId, didOwnedByVoter - 1, {
      from: accounts[0]
    })
    assert.equal(voted, true, `Accept votes for rewards less than the number of DID someone owns`)

  })


  it('should prevent votes over the maxRewardParameter value of maximum DID per task reward', async function () {

    const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
    const maxDIDRewardValue = await distense.getParameterValueByTitle.call(maxRewardParameterTitle)

    const votersNumDID = maxDIDRewardValue + 1  // Voter now owns at least as much DID as the max reward parameter

    await didToken.issueDID(accounts[0], 10000000)


    await tasks.addTask(task.taskId)
    const taskExists = await tasks.taskExists(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    //  Voter only has 100 and 101 is more than 100, so... this should fail
    let voted = await tasks.taskRewardVote.call(task.taskId, maxDIDRewardValue + 1, {
      from: accounts[0]
    })

    assert.equal(voted, false, `taskRewardVote should return false when user votes over maxRewardParameter`)

    voted = await tasks.taskRewardVote.call(task.taskId, /*maxDIDRewardValue - */1, {
      from: accounts[0]
    })

    assert.equal(voted, true, `Voter voted for less than the maxDIDRewardValue so true`)

  })


  it('should correctly determine reachedProposalApprovalThreshold', async function () {

    //  User must have DID to addTask()
    await didToken.issueDID(accounts[0], 100)

    const added = await tasks.addTask(task.taskId)
    assert(added, true, 'should have added a task here')

  })


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
  it(`should fire event LogAddTask when addTask is called`, async function () {

    let LogAddTaskEventListener = tasks.LogAddTask()

    await didToken.issueDID(accounts[0], 1)

    await tasks.addTask(task.taskId)

    let addTaskLog = await new Promise((resolve, reject) =>
      LogAddTaskEventListener.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    let eventArgs = addTaskLog[0].args
    assert.equal(eventArgs.taskId, task.taskId)
    assert.equal(addTaskLog.length, 1, 'should be 1 event')
  })


  it('should increase the pctDIDVoted on a task correctly', async function () {

    const maxDIDRewardValue = await distense.getParameterValueByTitle.call(
      await distense.maxRewardParameterTitle.call()
    )

    await didToken.issueDID(accounts[0], 9000)
    await didToken.issueDID(accounts[1], 1000)

    await tasks.addTask(task.taskId)

    await tasks.taskRewardVote(task.taskId, 1, {
      from: accounts[1]
    })

    const testTask = await tasks.getTaskById.call(task.taskId)

    assert.equal(testTask[3].toNumber(), 100, `sadf`)

  })


  it('should return false when someone tries to vote twice', async function () {

    const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
    const maxDIDRewardValue = await distense.getParameterValueByTitle.call(maxRewardParameterTitle)

    await didToken.issueDID(accounts[0], 10000)

    await tasks.addTask(task.taskId)

    //  Make sure vote is less than DID owned
    const voted = await tasks.taskRewardVote(task.taskId, maxDIDRewardValue - 1, {
      from: accounts[0]
    })

    const testTask = await tasks.getTaskById.call(task.taskId)

    assert.equal(testTask[3].toNumber(), 1000, 'task.pctDIDVoted should equal the pctDIDVoted by the first voter')

  })


  it('should setTaskRewardPaid correctly', async function () {

    await didToken.issueDID(accounts[0], 10000)
    await tasks.addTask(task.taskId)

    //  This is from accounts[0] which is approved
    await tasks.setTaskRewardPaid(task.taskId)

    const testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(testTask[2].toNumber(), 3, 'task reward should now be marked as true')

  })


  it('should determineTaskReward() correctly', async function () {

    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 20% each
    await didToken.issueDID(accounts[0], 10000)
    await didToken.issueDID(accounts[1], 10000)
    await didToken.issueDID(accounts[2], 10000)
    await didToken.issueDID(accounts[3], 10000)
    await didToken.issueDID(accounts[4], 10000)

    await tasks.addTask(taskTwo.taskId)

    testTask = await tasks.getTaskById.call(taskTwo.taskId)
    assert.equal(testTask[1].toNumber(), convertIntToSolidityInt(100), 'task reward should be 100 here')

    await tasks.taskRewardVote(taskTwo.taskId, 50, {
      from: accounts[3]
    })

    testTask = await tasks.getTaskById.call(taskTwo.taskId)
    assert.equal(
      convertSolidityIntToInt(testTask[1].toNumber()),
      90,
      'task reward should now be 90: 20% of DID voted half of default reward value'
    )

    await tasks.taskRewardVote(taskTwo.taskId, 0, {
      from: accounts[4]
    })
    testTask = await tasks.getTaskById.call(taskTwo.taskId)
    assert.equal(
      convertSolidityIntToInt(testTask[1].toNumber()),
      70,
      'task reward should now be 70: a 20% reduction from the current value of 90'
    )

  //  can be no more voting because we've reached the 40% DID voted threshold here

  })

  it('should set the reward status as determined once enough DID or voters have voted', async function () {

    await didToken.issueDID(accounts[0], 10000)
    await didToken.issueDID(accounts[1], 10000)
    await didToken.issueDID(accounts[2], 10000)

    await tasks.taskRewardVote(taskTwo.taskId, 50, {
      from: accounts[0]
    })

    testTask = await tasks.getTaskById.call(taskTwo.taskId)
    assert.equal(testTask[2].toNumber(), 2, 'Reward status should be 2 or determined since one-third of DID have voted')

  })

  it('should throw an error when task reward equals current task reward to save users gas as their vote will have no effect', async function () {

    let anError
    try {
      await didToken.issueDID(accounts[0], 10000)

      await tasks.addTask(taskTwo.taskId)

      await tasks.taskRewardVote(taskTwo.taskId, convertIntToSolidityInt(100), {
        from: accounts[2]
      })

    } catch (error) {
      anError = error
    }

    assert.notEqual(anError, undefined, 'should throw an error because vote was equal to default reward')

  })

})
