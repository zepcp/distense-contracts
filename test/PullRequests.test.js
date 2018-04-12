const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const PullRequests = artifacts.require('PullRequests')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')

import {
  convertIntToSolidityInt,
  convertSolidityIntToInt
} from './helpers/utils'

contract('PullRequests', function(accounts) {
  let didToken
  let distense
  let tasks
  let pullRequests
  beforeEach(async function() {
    didToken = await DIDToken.new()
    distense = await Distense.new(didToken.address)
    tasks = await Tasks.new(didToken.address, distense.address)
    pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )
  })

  const pullRequest = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d02511234',
    taskId:
      '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    prNum: '1234'
  }

  const pullRequestTwo = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0321',
    taskId:
      '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9',
    prNum: '4321'
  }

  it('should set initial external contract addresses correctly', async function() {
    let didTokenAddress
    didTokenAddress = await pullRequests.DIDTokenAddress()
    assert.notEqual(didTokenAddress, undefined, 'didTokenAddress undefined')

    let distenseAddress
    distenseAddress = await pullRequests.DistenseAddress()
    assert.notEqual(distenseAddress, undefined, 'distenseAddress undefined')

    let tasksAddress
    tasksAddress = await pullRequests.TasksAddress()
    assert.notEqual(tasksAddress, undefined, 'tasksAddress undefined')
  })

  it('pullRequestIds.length should be 0', async function() {
    let numPRs

    numPRs = await pullRequests.getNumPullRequests.call()
    assert.equal(numPRs.toNumber(), 0, 'numPRs should be 0')
  })

  it('should increment totalSupply of DID after a pull request reaches the required approvals', async function() {
    await didToken.issueDID(accounts[0], 1000000)

    await tasks.addTask(pullRequest.taskId, 'some title')
    const taskExists = await tasks.taskExists.call(pullRequest.taskId)
    assert.equal(
      taskExists,
      true,
      'task must exist to vote and approve a related pr later'
    )

    await tasks.taskRewardVote(pullRequest.taskId, 1000)

    await tasks.approve(pullRequests.address)
    const pullRequestsAddressApprovedForTasks = await tasks.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsAddressApprovedForTasks,
      true,
      'PullRequests needs to be approved to call a function within approvePullRequest()'
    )

    await didToken.approve(pullRequests.address)
    const pullRequestsApprovedForTasksForDIDToken = await didToken.approved(
      pullRequests.address
    )
    assert.equal(
      pullRequestsApprovedForTasksForDIDToken,
      true,
      'pullRequests.address needs to be approved to call a function within approvePullRequest()'
    )

    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    let adjustedTotalSupply = await didToken.totalSupply.call()
    const testTask = await tasks.getTaskById.call(pullRequest.taskId)

    await pullRequests.approvePullRequest(pullRequest.id)
    adjustedTotalSupply = +adjustedTotalSupply + +testTask[2]

    const postTotalSupply = await didToken.totalSupply.call()
    assert.equal(
      adjustedTotalSupply,
      postTotalSupply.toString(),
      'after total supply should be correctly higher than the beginning one'
    )
  })

  it('should addPullRequests correctly', async function() {
    let added

    let submitError
    const numPRs = await pullRequests.getNumPullRequests.call()
    assert.equal(numPRs.toNumber(), 0, 'numPRs should be 0 initially')

    try {
      added = await pullRequests.addPullRequest.call(
        pullRequest.id,
        pullRequest.taskId,
        pullRequest.prNum
      )
      assert.equal(added, true, 'Should have successfully added PR')

      //  Make sure pctDIDApproved is set to 0
      const pr = await pullRequests.getPullRequestById(pullRequest.id)
      assert.equal(
        pr[2].toNumber,
        0,
        'pctDIDApproved should be 0 for a brand new pullRequest'
      )

      await pullRequests.addPullRequest('4321', '4312', pullRequest.prNum)

      const numPRs = await pullRequests.getNumPullRequests.call()
      assert.equal(numPRs.toNumber(), 2, 'numPRs should be 2')
    } catch (error) {
      submitError = error
    }
  })

  it('voteOnApproval() enoughDIDToApprove modifier should reject votes from those without enough DID', async function() {
    let aNewError
    try {
      const numDIDRequired = await pullRequests.numDIDRequiredToApprovePRs.call()

      await didToken.issueDID(accounts[0], numDIDRequired - 1)
      assert.equal(
        await didToken.balances.call(accounts[0]),
        numDIDRequired - 1,
        'balance should be 100 or less than threshold here'
      )

      await pullRequests.approvePullRequest(pullRequestTwo.id, false)
    } catch (error) {
      aNewError = error
    }

    assert.notEqual(
      aNewError,
      undefined,
      'error should be thrown if someone with not enough DID approval votes on a PR'
    )
  })

  it('approvePullRequest() should reject approval votes from those who have already voted on that PR', async function() {
    let anError
    try {
      await didToken.issueDID(accounts[0], 1230000)
      assert.equal(
        await didToken.balances.call(accounts[0]),
        1230000,
        'balance should be sufficient to vote -- above threshold'
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

      //  First time voting -- that's cool
      await pullRequests.approvePullRequest(pullRequest.id)

      //  WUT?!  How dare you vote a second time!!!!?
      await pullRequests.approvePullRequest(pullRequest.id)
    } catch (error) {
      anError = error
    }

    assert.notEqual(
      anError,
      undefined,
      'Should not throw here -- approvePullRequest() should return and not throw here'
    )
  })

  it('approvePullRequest() should increment the pctDIDApproved correctly', async function() {
    await didToken.issueDID(accounts[0], 1200000)
    await didToken.issueDID(accounts[1], 1200000)
    await didToken.issueDID(accounts[2], 1200000)

    await tasks.addTask(pullRequest.taskId, 'some amazing title')
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

    await pullRequests.approvePullRequest(pullRequest.id, {
      from: accounts[2]
    })

    const votedOnPR = await pullRequests.getPullRequestById.call(pullRequest.id)
    assert.equal(votedOnPR[3].toNumber(), 20000000000, '')
  })

  it('should fire event "LogAddPullRequest" when addPullRequest is appropriately called', async function() {
    await didToken.issueDID(accounts[5], 1200000)

    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    let addPullRequestEvents = pullRequests.LogAddPullRequest()
    let addPullRequestLog = await new Promise((resolve, reject) =>
      addPullRequestEvents.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    assert.equal(addPullRequestLog.length, 1, 'should be 1 event')
    let eventArgs = addPullRequestLog[0].args
    assert.equal(eventArgs._prId, pullRequest.id)
    assert.equal(eventArgs.taskId, pullRequest.taskId)
  })

  it('should fire event "LogPullRequestApprovalVote" when approvePullRequest is appropriately called', async function() {
    await didToken.issueDID(accounts[5], 1200000)
    await didToken.issueDID(accounts[0], 1200000)

    await tasks.addTask(pullRequest.taskId, 'some amazing title')

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

    await pullRequests.approvePullRequest(pullRequest.id, {
      from: accounts[5]
    })

    let approvePullRequestEvents = pullRequests.LogPullRequestApprovalVote()
    let approvePullRequestLog = await new Promise((resolve, reject) =>
      approvePullRequestEvents.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    assert.equal(approvePullRequestLog.length, 1, 'should be 1 event')
    let eventArgs = approvePullRequestLog[0].args
    assert.equal(eventArgs._prId, pullRequest.id)
    assert.equal(
      eventArgs.pctDIDApproved.toString(),
      '20000000000',
      'pctDIDApproved'
    )
  })

  it('should fire event "LogRewardPullRequest" when addPullRequest is appropriately called', async function() {
    await didToken.issueDID(accounts[5], 1200000)
    await didToken.issueDID(accounts[4], 1200000)
    await didToken.issueDID(accounts[0], 1200000)

    await tasks.addTask(pullRequest.taskId, 'some amazing title')

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

    await pullRequests.approvePullRequest(pullRequest.id, {
      from: accounts[0]
    })

    let LogRewardPullRequestEvents = pullRequests.LogRewardPullRequest()
    let LogRewardPullRequestLog = await new Promise((resolve, reject) =>
      LogRewardPullRequestEvents.get(
        (error, log) => (error ? reject(error) : resolve(log))
      )
    )

    assert.equal(LogRewardPullRequestLog.length, 1, 'should be 1 event')
    let eventArgs = LogRewardPullRequestLog[0].args
    assert.equal(eventArgs._prId, pullRequest.id)
    assert.equal(eventArgs.taskId, pullRequest.taskId)
  })

  it("should increment a contributor's Contributions DID correctly after a pull request reaches the required approvals", async function() {
    await didToken.issueDID(accounts[0], 1000000)
    await didToken.incrementDIDFromContributions(accounts[0], 1000000)

    await tasks.addTask(pullRequest.taskId, 'some title')
    const taskExists = await tasks.taskExists.call(pullRequest.taskId)
    assert.equal(
      taskExists,
      true,
      'task must exist to vote and approve a related pr later'
    )

    await tasks.taskRewardVote(pullRequest.taskId, 1000)

    await tasks.approve(pullRequests.address)
    const pullRequestsAddressApprovedForTasks = await tasks.approved.call(
      pullRequests.address
    )
    assert.equal(
      pullRequestsAddressApprovedForTasks,
      true,
      'PullRequests needs to be approved to call a function within approvePullRequest()'
    )

    await didToken.approve(pullRequests.address)
    const pullRequestsApprovedForTasksForDIDToken = await didToken.approved(
      pullRequests.address
    )
    assert.equal(
      pullRequestsApprovedForTasksForDIDToken,
      true,
      'pullRequests.address needs to be approved to call a function within approvePullRequest()'
    )

    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      pullRequest.prNum
    )

    await pullRequests.approvePullRequest(pullRequest.id)

    const contributionsDID = await didToken.getNetNumContributionsDID.call(
      accounts[0]
    )
    const DID = await didToken.getAddressBalance.call(accounts[0])

    assert.isAbove(DID, 1000000)
    assert.isAbove(contributionsDID, 1000000)
  })

  it('should set the prNum correctly when adding pullRequests', async function() {
    await didToken.issueDID(accounts[0], 1200000)

    await tasks.addTask(pullRequest.taskId, 'some amazing title')

    await pullRequests.addPullRequest(
      pullRequest.id,
      pullRequest.taskId,
      '5959'
    )

    const pr = await pullRequests.getPullRequestById.call(pullRequest.id)
    assert.equal(pr[2].toNumber(), '5959', 'prNum should be 5959')
  })
})
