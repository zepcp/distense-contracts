const web3 = global.web3
const Tasks = artifacts.require('Tasks')
const PullRequests = artifacts.require('PullRequests')
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')


contract('PullRequests', function(accounts) {
  beforeEach(async function() {
    tasks = await Tasks.new()
    didToken = await DIDToken.new()
    distense = await Distense.new()
    pullRequests = await PullRequests.new(
      didToken.address,
      distense.address,
      tasks.address
    )
  })

  const pullRequest = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0251',
    taskId: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0123'
  }

  const pullRequestTwo = {
    id: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0321',
    taskId: '0x163383955592153e645ab6dc0664d33698b9207459e9abbfece1535d0321'
  }

  it('should set initial external contract addresses correctly', async function() {
    let didTokenAddress
    didTokenAddress = await pullRequests.DIDTokenAddress()
    assert.notEqual(didTokenAddress, undefined, 'didTokenAddress undefined')

    let tasksAddress
    tasksAddress = await pullRequests.TasksAddress()
    assert.notEqual(tasksAddress, undefined, 'tasksAddress undefined')

    let distenseAddress
    distenseAddress = await pullRequests.DistenseAddress()
    assert.notEqual(distenseAddress, undefined, 'distenseAddress undefined')
  })

  it('pullRequestIds.length should be 0', async function() {

    let numPRs

    numPRs = await pullRequests.getNumPullRequests.call()
    assert.equal(numPRs.toNumber(), 0, 'numPRs should be 0')
  })


  it('should addPullRequests correctly', async function() {
    let added

    numPRs = await pullRequests.getNumPullRequests.call()
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


  it('voteOnApproval() should reject approval votes from those who have already voted on that PR', async function () {

    const title = await distense.numDIDRequiredToApproveVotePullRequestTitle.call()
    const numDIDRequired = await distense.getParameterValueByTitle.call(title)
    assert.equal(numDIDRequired, 2000, 'beginning number of numDIDToApprove should be accurate'    )

    let anError
    try {

      await didToken.issueDID(accounts[0], numDIDRequired + 1)
      assert.equal(
        await didToken.balances.call(accounts[0]),
        numDIDRequired,
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

    assert.notEqual(anError, undefined, 'Should throw an error when voting twice')
    // assert.equal(true, false, 'TODO make sure this throws once something else -- false positive')

  })


  it('voteOnApproval() should increment the pctDIDApproved correctly', async function () {

    const title = await distense.numDIDRequiredToApproveVotePullRequestTitle.call()
    const numDIDRequired = await distense.getParameterValueByTitle.call(title)

    assert.equal(
      numDIDRequired,
      2000,
      'beginning number of numDIDToApprove should be accurate'
    )


    await didToken.issueDID(accounts[0], numDIDRequired)
    const numDIDOwned = await didToken.balances.call(accounts[0])


    assert.equal(
      numDIDOwned.toNumber(),
      numDIDRequired,
      'balance should be sufficient to vote: above threshold'
    )

    await pullRequests.addPullRequest(pullRequest.id, pullRequest.taskId)
    await pullRequests.approvePullRequest(pullRequest.id)

    const votedOnPR = await pullRequests.getPullRequestById.call(pullRequest.id)

    assert.isAbove(votedOnPR[2], 0, 'pctDIDVoted of the votedOnPullRequest should be greater than zero')

  })

})
