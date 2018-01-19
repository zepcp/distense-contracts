const Tasks = artifacts.require('Tasks')
const PullRequests = artifacts.require('PullRequests')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')

contract('PullRequests', function (accounts) {

  let didToken
  let distense
  let tasks
  let pullRequests
  beforeEach(async function () {

    didToken = await DIDToken.new()
    distense = await Distense.new()
    tasks = await Tasks.new(
      didToken.address,
      distense.address
    )
    pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )

  })

  const pullRequest = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0251',
    taskId: '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
  }

  const pullRequestTwo = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0321',
    taskId: '0x856761ab87f7b123dc438fb62e937c62aa3afe97740462295efa335ef7b75ec9'
  }


  it('should set initial external contract addresses correctly', async function () {
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


  it('pullRequestIds.length should be 0', async function () {

    let numPRs

    numPRs = await pullRequests.getNumPullRequests.call()
    assert.equal(numPRs.toNumber(), 0, 'numPRs should be 0')
  })


  it('should issueDID correctly after a pull request reaches the required approvals', async function () {

    await didToken.issueDID(accounts[0], 1000000)
    const newBalance = await didToken.balances.call(accounts[0])
    assert.equal(newBalance.toNumber(), 1000000, 'pullRequest approver must and should own some DID here')

    await pullRequests.addPullRequest(pullRequest.id, pullRequest.taskId)

    //  got to have a task to interact with
    await tasks.addTask(pullRequest.taskId, 'some title')
    const taskExists = await tasks.taskExists.call(pullRequest.taskId)
    assert.equal(taskExists, true, 'task must exist to vote and approve a related pr later')


    await tasks.taskRewardVote(pullRequest.taskId, 10)

    await tasks.approve(pullRequests.address)
    const pullRequestsAddressApprovedForTasks = await tasks.approved.call(pullRequests.address)
    assert.equal(pullRequestsAddressApprovedForTasks, true, 'PullRequests needs to be approved to call a function within approvePullRequest()')

    await didToken.approve(pullRequests.address)
    const pullRequestsApprovedForTasksForDIDToken = await didToken.approved(
      pullRequests.address
    )
    assert.equal(
      pullRequestsApprovedForTasksForDIDToken,
      true,
      'pullRequests.address needs to be approved to call a function within approvePullRequest()'
    )

    await pullRequests.approvePullRequest(pullRequest.id)

  })


  it('should addPullRequests correctly', async function () {
    let added

    let submitError
    const numPRs = await pullRequests.getNumPullRequests.call()
    assert.equal(numPRs.toNumber(), 0, 'numPRs should be 0 initially')

    try {
      added = await pullRequests.addPullRequest.call(
        pullRequest.id,
        pullRequest.taskId
      )
      assert.equal(
        added,
        true,
        'Should have successfully added PR'
      )

      //  Make sure pctDIDApproved is set to 0
      const pr = await pullRequests.getPullRequestById(pullRequest.id)
      assert.equal(
        pr[2].toNumber,
        0,
        'pctDIDApproved should be 0 for a brand new pullRequest'
      )

      await pullRequests.addPullRequest('4321', '4312')

      const numPRs = await pullRequests.getNumPullRequests.call()
      assert.equal(numPRs.toNumber(), 2, 'numPRs should be 2')
    } catch (error) {
      submitError = error
    }
  })


  it('voteOnApproval() enoughDIDToApprove modifier should reject votes from those without enough DID', async function () {

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


  it('approvePullRequest() should reject approval votes from those who have already voted on that PR', async function () {

    let anError
    try {

      await didToken.issueDID(accounts[0], 1230000)
      assert.equal(
        await didToken.balances.call(accounts[0]),
        1230000,
        'balance should be sufficient to vote -- above threshold'
      )

      await pullRequests.addPullRequest(pullRequest.id, pullRequest.taskId)

      //  First time voting -- that's cool
      await pullRequests.approvePullRequest(pullRequest.id)

      //  WUT?!  How dare you vote a second time!!!!?
      await pullRequests.approvePullRequest(pullRequest.id)

    } catch (error) {
      anError = error
    }

    assert.notEqual(anError, undefined, 'Should not throw here -- approvePullRequest() should return and not throw here')

  })


  it('approvePullRequest() should increment the pctDIDApproved correctly', async function () {

    await didToken.issueDID(accounts[0], 1200000)


    await pullRequests.addPullRequest(pullRequest.id, pullRequest.taskId)
    await pullRequests.approvePullRequest(pullRequest.id)

    const votedOnPR = await pullRequests.getPullRequestById.call(pullRequest.id)

    // // isAbove because we just need to make sure it's incremented, amount is less important
    assert.isAbove(votedOnPR[3].toNumber(), 0, 'pctDIDVoted of the votedOnPullRequest should be greater than zero')

  })

})















