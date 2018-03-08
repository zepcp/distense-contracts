const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const PullRequests = artifacts.require('PullRequests')
const numDIDRequiredToAddTask = require('./Distense.test')

import {
  convertIntToSolidityInt,
  convertSolidityIntToInt
} from './helpers/utils'

module.exports.increaseTime = addSeconds => {
  web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds],
    id: 0
  })
}

contract('Tasks', function(accounts) {
  const task = {
    taskId:
      '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    title: 'Some amazing task'
  }

  const taskTwo = {
    taskId:
      '0x8546123ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    title: 'Another amazing task'
  }

  const taskThree = {
    taskId:
      '0x4246123ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    title: 'Yet another amazing task'
  }

  const pullRequest = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d02511234',
    taskId:
      '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    prNum: '1234'
  }

  let didToken
  let distense
  let tasks

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
    await didToken.issueDID(accounts[0], 101)
    await tasks.addTask(task.taskId, task.title)
    let numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 1, 'numTasks should be 1')
  })

  it(`shouldn't let those who don\'t own DID to add tasks`, async function() {
    let addError

    await didToken.issueDID(accounts[1], 99)

    try {
      await tasks.addTask(task.taskId, task.title, {
        from: accounts[1]
      })
    } catch (error) {
      addError = error
    }

    assert.notEqual(
      addError,
      undefined,
      'Error must be thrown when user with no DID addTasks()s'
    )

    const numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 0, 'numTasks should still be 0')
  })

  it('should return true or otherwise modify the task with taskRewardVote() when the voter hasDID', async function() {
    await didToken.issueDID(accounts[0], convertIntToSolidityInt(1000))
    await didToken.issueDID(accounts[1], convertIntToSolidityInt(1000))

    await tasks.addTask(task.taskId, task.title)
    const taskExists = await tasks.taskExists.call(task.taskId)
    assert.equal(taskExists, true, 'task should exist')

    //  Make sure vote is less than DID owned
    await tasks.taskRewardVote(task.taskId, 50, {
      from: accounts[1]
    })

    const taskDiffThanInitial = await tasks.getTaskById.call(task.taskId)
    assert.isAbove(
      taskDiffThanInitial[3].toNumber(),
      0,
      'task pctDIDVoted should be greater than 0'
    )
  })

  it('should return false when someone tries to vote twice', async function() {
    await didToken.issueDID(accounts[0], 1000000)

    await tasks.addTask(task.taskId, task.title)

    //  Make sure vote is less than DID owned
    await tasks.taskRewardVote(task.taskId, 1000, {
      from: accounts[0]
    })

    let doubleVoteError
    try {
      await tasks.taskRewardVote(task.taskId, 1000, {
        from: accounts[0]
      })
    } catch (error) {
      doubleVoteError = error
    }

    assert.notEqual(doubleVoteError, undefined, 'should throw an error here')
  })

  it('should throw when someone tries to vote on a task for for a reward that is greater than the number of DID they own', async function() {
    let anError
    try {
      const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
      const maxDIDRewardValue = await distense.getParameterValueByTitle.call(
        maxRewardParameterTitle
      )

      const didOwnedByVoter = 50
      await didToken.issueDID(accounts[0], didOwnedByVoter)

      assert.isBelow(
        didOwnedByVoter,
        maxDIDRewardValue,
        'Make sure voter will not accidentally trip a the higher than maxDIDReward parameter value'
      )

      await tasks.addTask(task.taskId, task.title)
      const taskExists = await tasks.taskExists(task.taskId)
      assert.equal(taskExists, true, 'task should exist')

      //  Voter is voting for more than the DID they have
      let voted = await tasks.taskRewardVote.call(
        task.taskId,
        didOwnedByVoter + 1,
        {
          from: accounts[0]
        }
      )
      assert.equal(
        voted,
        false,
        `Reject votes for rewards greater than the number of DID someone owns`
      )

      // Voter is now voting for how much DID they own minus 1
      voted = await tasks.taskRewardVote.call(
        task.taskId,
        didOwnedByVoter - 1,
        {
          from: accounts[0]
        }
      )
      assert.equal(
        voted,
        true,
        `Accept votes for rewards less than the number of DID someone owns`
      )
    } catch (error) {
      anError = error
    }

    assert.notEqual(anError, undefined, 'error should have been thrown here')
  })

  it('should prevent votes over the maxRewardParameter value of maximum DID per task reward', async function() {
    let anError
    try {
      const maxRewardParameterTitle = await distense.maxRewardParameterTitle.call()
      assert.isAbove(maxRewardParameterTitle, 0, 'ensure sanity')
      const maxDIDRewardValue = await distense.getParameterValueByTitle.call(
        maxRewardParameterTitle
      )
      await didToken.issueDID(accounts[0], 10000)

      await tasks.addTask(task.taskId, task.title)
      const taskExists = await tasks.taskExists(task.taskId)
      assert.equal(taskExists, true, 'task should exist')

      voted = await tasks.taskRewardVote.call(
        task.taskId,
        maxDIDRewardValue + 1,
        {
          from: accounts[0]
        }
      )
    } catch (error) {
      anError = error
    }

    assert.notEqual(
      anError,
      undefined,
      'voting over the maxDIDRewardValue should throw'
    )
  })

  it('should correctly addTask', async function() {
    //  User must have DID to addTask()
    await didToken.issueDID(accounts[0], 100)

    let numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 0, 'should have 0 tasks to begin with')

    await tasks.addTask(task.taskId, task.title)

    numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 1, 'should have added a task')
    // assert.equal(false, true)
  })

  it('should not add tasks with empty bytes32', async function() {
    let addError
    try {
      //contract throws error here
      await tasks.addTask('')
    } catch (error) {
      addError = error
    }
    assert.notEqual(
      addError,
      undefined,
      'Error should be thrown when inserting empty bytes32'
    )

    const numTasks = await tasks.getNumTasks.call()
    assert.equal(
      numTasks,
      0,
      'No task should be added when empty string passed'
    )
  })

  /* EVENTS */
  it(`should fire event LogAddTask when addTask is called`, async function() {
    let LogAddTaskEventListener = tasks.LogAddTask()

    await didToken.issueDID(accounts[0], 190)

    await tasks.addTask(task.taskId, task.title)

    let addTaskLog = await new Promise((resolve, reject) =>
      LogAddTaskEventListener.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    let eventArgs = addTaskLog[0].args
    assert.equal(eventArgs.taskId, task.taskId)
    assert.equal(addTaskLog.length, 1, 'should be 1 event')
  })

  it('should increase the pctDIDVoted on a task correctly', async function() {
    await didToken.issueDID(accounts[0], 90000)
    await didToken.issueDID(accounts[1], 60000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.taskRewardVote(task.taskId, 90, {
      from: accounts[1]
    })

    const testTask = await tasks.getTaskById.call(task.taskId)

    assert.equal(
      testTask[4].toNumber(),
      convertIntToSolidityInt(40),
      `pctDIDVoted should be ...`
    )
  })

  it('should setTaskRewardPaid correctly', async function() {
    await didToken.issueDID(accounts[0], 10000)
    await tasks.addTask(task.taskId, task.title)

    //  This is from accounts[0] which is approved
    await tasks.setTaskRewardPaid(task.taskId)

    const testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(
      testTask[3].toNumber(),
      2,
      'task reward should now be marked as true'
    )
  })

  it('should set task rewards as DETERMINED correctly', async function() {
    await didToken.issueDID(accounts[0], 10000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.setTaskRewardPaid(task.taskId)

    const testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(
      testTask[3].toNumber(),
      2,
      'task reward should now be marked as true'
    )
  })

  it('should determineTaskReward() correctly #1', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 20% each
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)
    await didToken.issueDID(accounts[3], 10000000)
    await didToken.issueDID(accounts[4], 10000000)

    await tasks.addTask(task.taskId, task.title)

    let testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(testTask[2].toNumber(), 100, 'task reward should be 100 here')

    await tasks.taskRewardVote(task.taskId, 50, {
      from: accounts[3]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      90,
      'task reward should now be 90: 20% of DID voted half of default reward value'
    )

    await tasks.taskRewardVote(task.taskId, 0, {
      from: accounts[4]
    })

    taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      72,
      'task reward should now be 72: a 20% reduction from the current value of 90'
    )
  })

  //  second test for same thing as require statements prevent too many % DID from voting
  it('should determineTaskReward() correctly #2', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 33% each
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.taskRewardVote(task.taskId, 0, {
      from: accounts[0]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      75,
      'task reward should now be 75: 33% of DID voted 0 but the votingPowerLimit initial value is 25%'
    )
  })

  // third test for same thing as require statements prevent too many % DID from voting
  it('should determineTaskReward() correctly #3', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 20% each
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)
    await didToken.issueDID(accounts[3], 10000000)
    await didToken.issueDID(accounts[4], 10000000)
    await didToken.issueDID(accounts[5], 10000000)
    await didToken.issueDID(accounts[6], 10000000)

    await tasks.addTask(task.taskId, task.title)

    let testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(testTask[2].toNumber(), 100, 'task reward should be 100 here')

    await tasks.taskRewardVote(task.taskId, 0, {
      from: accounts[0]
    })

    const taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      86,
      'task reward should now be 6666: 33% of DID voted 0'
    )
  })

  it('should determineTaskReward() correctly #4', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 20% each
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)
    await didToken.issueDID(accounts[3], 10000000)
    await didToken.issueDID(accounts[4], 10000000)
    await didToken.issueDID(accounts[5], 10000000)

    await tasks.addTask(task.taskId, task.title)

    const testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(testTask[2].toNumber(), 100, 'task reward should be 100 here')

    await tasks.taskRewardVote(task.taskId, 10, {
      from: accounts[4]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(taskReward.toString(), 85, 'task reward should now be 85')

    await tasks.taskRewardVote(task.taskId, 23, {
      from: accounts[5]
    })

    taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(taskReward.toString(), 75, 'task reward should now be 75')
  })

  it('should determineTaskReward() correctly #5', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 25% each
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)
    await didToken.issueDID(accounts[3], 10000000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.taskRewardVote(task.taskId, 199, {
      from: accounts[0]
    })

    const taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(taskReward.toString(), 124, 'task reward should now be 124')
  })

  it('should set the reward status as determined once enough DID or voters have voted', async function() {
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.taskRewardVote(task.taskId, 50, {
      from: accounts[0]
    })

    const testTask = await tasks.getTaskById.call(task.taskId)

    assert.equal(
      testTask[3].toNumber(),
      1,
      'Reward status should be 2 or determined since one-third of DID have voted'
    )
  })

  it('should correctly return the task reward and rewardStatus', async function() {
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[2], 10000000)

    await tasks.addTask(taskTwo.taskId, taskTwo.title)

    const taskRewardAndStatus = await tasks.getTaskRewardAndStatus(
      taskTwo.taskId
    )

    assert.equal(
      taskRewardAndStatus[0].toNumber(),
      100,
      'task reward should be 100'
    )
    assert.equal(
      taskRewardAndStatus[1].toNumber(),
      0,
      'task rewardStatus should be enum DEFAULT or 0'
    )
  })

  it('should throw an error when task reward equals current task reward to save users gas as their vote will have no effect', async function() {
    let anError
    try {
      await didToken.issueDID(accounts[0], 10000)

      await tasks.addTask(taskTwo.taskId, taskTwo.title)

      await tasks.taskRewardVote(taskTwo.taskId, convertIntToSolidityInt(100), {
        from: accounts[2]
      })
    } catch (error) {
      anError = error
    }

    assert.notEqual(
      anError,
      undefined,
      'should throw an error because vote was equal to default reward'
    )
  })

  it(`should delete tasks that have been paid and reposition the last array element into the deleted index`, async function() {
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)

    tasks = await Tasks.new(didToken.address, distense.address)
    await tasks.addTask(taskTwo.taskId, taskTwo.title)
    await tasks.addTask(task.taskId, task.title)
    await tasks.addTask(task.taskId, task.title)
    await tasks.addTask(taskThree.taskId, taskThree.title)

    await tasks.taskRewardVote(task.taskId, 3000, {
      from: accounts[0]
    })

    const pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )
    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    await didToken.approve(pullRequests.address)
    const pullRequestsDIDTokenApproved = await didToken.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsDIDTokenApproved,
      true,
      'pullRequests has to be approved here'
    )

    await tasks.approve(pullRequests.address)
    const pullRequestsTasksApproved = await tasks.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsTasksApproved,
      true,
      'pullRequests has to be tasks approved here'
    )

    await pullRequests.approvePullRequest(pullRequest.id)

    let numTaskIds = await tasks.getNumTasks.call()
    assert.equal(numTaskIds.toString(), '4', 'should be 4 tasks')

    await tasks.deleteTask(task.taskId)

    numTaskIds = await tasks.getNumTasks.call()
    assert.equal(numTaskIds.toString(), '3', 'double check there are 2 taskIds')

    const taskExists = await tasks.getTaskById.call(task.taskId)
    assert.equal(
      taskExists[0].toString(),
      '',
      'deleted task title should now be empty string'
    )
  })

  it(`should not delete tasks that haven't been paid`, async function() {
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)

    tasks = await Tasks.new(didToken.address, distense.address)
    await tasks.addTask(taskTwo.taskId, taskTwo.title)
    await tasks.addTask(task.taskId, task.title)
    await tasks.addTask(task.taskId, task.title)
    await tasks.addTask(taskThree.taskId, taskThree.title)

    await tasks.taskRewardVote(task.taskId, 3000, {
      from: accounts[0]
    })

    const pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )
    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    await didToken.approve(pullRequests.address)
    const pullRequestsDIDTokenApproved = await didToken.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsDIDTokenApproved,
      true,
      'pullRequests has to be approved here'
    )

    await tasks.approve(pullRequests.address)
    const pullRequestsTasksApproved = await tasks.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsTasksApproved,
      true,
      'pullRequests has to be tasks approved here'
    )

    let numTaskIds = await tasks.getNumTasks.call()
    assert.equal(numTaskIds.toString(), '4', 'should be 4 tasks')

    await tasks.deleteTask(task.taskId)

    numTaskIds = await tasks.getNumTasks.call()
    assert.equal(numTaskIds.toString(), '4', 'double check there are 2 taskIds')

    const taskExists = await tasks.getTaskById.call(task.taskId)
    assert.equal(
      taskExists[0].toString(),
      task.title,
      'deleted task title should be the original title'
    )
  })
})
