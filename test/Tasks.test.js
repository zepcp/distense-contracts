const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const PullRequests = artifacts.require('PullRequests')

import { convertIntToSolidityInt } from './helpers/utils'

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
    await didToken.issueDID(accounts[0], 1234)
    //  addTask from default accounts[0]
    await tasks.addTask(task.taskId, task.title)
    let numTasks = await tasks.getNumTasks.call()
    assert.equal(numTasks, 1, 'numTasks should be 1')
  })

  it(`shouldn't let those who don\'t own DID to add tasks`, async function() {
    let addError

    try {
      const userBalance = await didToken.balances.call(accounts[1])
      assert.equal(userBalance, 0, `user's DID balance should be 0 here`)

      await tasks.addTask(task.taskId, task.title, {
        from: accounts[1] // accounts[1] has no DID
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

  it('should correctly determine reachedProposalApprovalThreshold', async function() {
    //  User must have DID to addTask()
    await didToken.issueDID(accounts[0], 100)

    const added = await tasks.addTask(task.taskId, task.title)
    assert(added, true, 'should have added a task here')
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

    await didToken.issueDID(accounts[0], 90)

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
    assert.equal(
      testTask[2].toNumber(),
      10000,
      'task reward should be 10000 here'
    )

    await tasks.taskRewardVote(task.taskId, convertIntToSolidityInt(50), {
      from: accounts[3]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      9000,
      'task reward should now be 9000: 20% of DID voted half of default reward value'
    )

    await tasks.taskRewardVote(task.taskId, 0, {
      from: accounts[4]
    })

    taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      7200,
      'task reward should now be 7200: a 20% reduction from the current value of 90'
    )
  })

  //  second test for same thing as require statements prevent too many % DID from voting
  it('should determineTaskReward() correctly #2', async function() {
    // Issue DID such that some account owns
    // under the threshold of DID required
    // Here it's 20% each
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
      6667,
      'task reward should now be 6666: 33% of DID voted 0'
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
    assert.equal(
      testTask[2].toNumber(),
      10000,
      'task reward should be 100 here'
    )

    await tasks.taskRewardVote(task.taskId, 0, {
      from: accounts[0]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      8571,
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

    let testTask = await tasks.getTaskById.call(task.taskId)
    assert.equal(
      testTask[2].toNumber(),
      10000,
      'task reward should be 100 here'
    )

    await tasks.taskRewardVote(task.taskId, convertIntToSolidityInt(10), {
      from: accounts[4]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(taskReward.toString(), 8500, 'task reward should now be 8500')

    await tasks.taskRewardVote(task.taskId, convertIntToSolidityInt(23), {
      from: accounts[5]
    })

    taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(taskReward.toString(), 7467, 'task reward should now be 7467')
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

    await tasks.taskRewardVote(task.taskId, convertIntToSolidityInt(199), {
      from: accounts[0]
    })

    let taskReward = await tasks.getTaskReward.call(task.taskId)
    assert.equal(
      taskReward.toString(),
      12475,
      'task reward should now be 12500'
    )
  })

  it('should set the reward status as determined once enough DID or voters have voted', async function() {
    await didToken.issueDID(accounts[0], 10000000)
    await didToken.issueDID(accounts[1], 10000000)
    await didToken.issueDID(accounts[2], 10000000)

    await tasks.addTask(task.taskId, task.title)

    await tasks.taskRewardVote(task.taskId, convertIntToSolidityInt(50), {
      from: accounts[0]
    })

    let testTask = await tasks.getTaskById.call(task.taskId)

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
      10000,
      'task reward should be 10000 here (100)'
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

  it(`getIndexOfTaskId should return the proper index #1`, async function() {
    await didToken.issueDID(accounts[0], 100000)
    await tasks.addTask('0x1234', task.title)
    await tasks.addTask(task.taskId, task.title)

    const index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(index, 1, 'index should be 2 here')
  })

  it(`getIndexOfTaskId should return the proper index #2`, async function() {
    await didToken.issueDID(accounts[0], 100000)
    await tasks.addTask('0x1234', task.title)
    await tasks.addTask(taskTwo.taskId, taskTwo.title)
    await tasks.addTask(task.taskId, task.title)

    const index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(index, 2, 'index should be 2 here')
  })

  it(`getIndexOfTaskId should return the proper index #3`, async function() {
    const index = await tasks.getIndexOfTaskId.call(task.taskId)
    let numTaskIds = await tasks.getNumTasks.call()
    numTaskIds++
    assert.equal(index.toString(), numTaskIds, 'index should be 1 here')
  })

  it(`should delete tasks that have been paid by approved contributors`, async function() {
    await didToken.issueDID(accounts[0], 10000000)

    tasks = await Tasks.new(didToken.address, distense.address)
    await tasks.addTask(taskTwo.taskId, taskTwo.title)
    await tasks.addTask(task.taskId, task.title)

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

    let index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(index.toString(), '1', 'index should be 1')
    await tasks.deleteTaskId(task.taskId)

    let numTaskIds = await tasks.getNumTasks.call()
    numTaskIds++

    index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(index.toString(), numTaskIds, 'index should be 1 here')

    const updatedNumTasks = await tasks.getNumTasks.call()
    assert.equal(
      updatedNumTasks.toString(),
      1,
      'sanity check making sure there are 1 taskIds'
    )
  })

  it(`should not delete tasks that have not been paid`, async function() {
    didToken = await DIDToken.new()
    distense = await Distense.new()
    tasks = await Tasks.new(didToken.address, distense.address)
    const pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )

    await didToken.issueDID(accounts[0], 10000000)

    await tasks.addTask(task.taskId, task.title)

    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    //  contract address approvals
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

    await pullRequests.approvePullRequest(pullRequest.id, {
      from: accounts[0]
    })

    let index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(
      index.toString(),
      0,
      'index should be above 0 to begin with for this test to be valid'
    )
    //  crux of test

    let numTaskIds = await tasks.getNumTasks.call()
    numTaskIds++
    await tasks.deleteTaskId(task.taskId)

    numTaskIds = await tasks.getNumTasks.call()
    numTaskIds++

    index = await tasks.getIndexOfTaskId.call(task.taskId)
    assert.equal(index.toString(), numTaskIds, 'index should be 1 here')
  })
})
