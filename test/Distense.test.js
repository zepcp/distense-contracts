const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const convertBytes32ToString = require('./helpers/utils')
const assertJump = require('./helpers/assertJump')



contract('Distense contract', function (accounts) {
  const proposalPctDIDToApproveParameter = {
    title: 'proposalPctDIDToApprove',
    value: 250 // Hard coded in constructor function in contract
  }

  const pullRequestPctDIDParameter = {
    title: 'pctDIDRequiredToMergePullRequest',
    // Hard coded in constructor function in contract
    //  This is 10 because no floating point in Solidity
    value: 100
  }

  const votingIntervalParameter = {
    title: 'votingInterval',
    value: 1296000 // Equal to 15 days in Solidity
  }


  it('should set the initial attributes correctly', async function () {
    let param = await distense.getParameterByTitle(
      pullRequestPctDIDParameter.title
    )

    assert.equal(
      convertBytes32ToString(param[0]),
      pullRequestPctDIDParameter.title
    )
    assert.equal(param[1].toNumber(), pullRequestPctDIDParameter.value)
  })


  it('should set the proposalPctDIDApprovalParameter correctly', async function () {
    let param = await distense.getParameterByTitle(
      proposalPctDIDToApproveParameter.title
    )

    assert.equal(
      convertBytes32ToString(param[0].toString()),
      proposalPctDIDToApproveParameter.title
    )
    assert.equal(param[1], proposalPctDIDToApproveParameter.value)
  })


  it('should set the initial attributes correctly', async function () {
    const numParameters = await distense.getNumParameters.call()
    assert.equal(numParameters.toNumber(), 5)
  })


  it('should correctly throw errors for proposalPctDIDApproval votes with values equal to the current value', async function () {
    let equalValueError
    const didToken = await DIDToken.new()

    const distense = await Distense.new(didToken.address)
    try {
      await distense.voteOnParameter(
        proposalPctDIDToApproveParameter.title,
        proposalPctDIDToApproveParameter.value
      )
    } catch (error) {
      equalValueError = error
    }
    assert.notEqual(equalValueError, undefined, 'Error must be thrown')
  })


  it('should correctly throw errors for pullRequestNumApprovalsParameter votes with values equal to the current value', async function () {
    let equalValueError
    const didToken = await DIDToken.new()

    const distense = await Distense.new(didToken.address)
    try {
      await distense.voteOnParameter(
        pullRequestPctDIDParameter.title,
        pullRequestPctDIDParameter.value
      )
    } catch (error) {
      equalValueError = error
    }
    assert.notEqual(equalValueError, undefined, 'Error must be thrown')
  })


  it('should disallow voting for those who don\'t own DID', async function () {
    let equalValueError
    try {
      await distense.voteOnParameter(pullRequestPctDIDParameter.title, 122, {
        from: accounts[2] // no DID for this account
      })
    } catch (error) {
      equalValueError = error
    }
    assert.notEqual(
      equalValueError,
      undefined,
      'reject parameter votes from those who don\'t own DID'
    )
  })

  //  Begin accounts[0] owns 200 or 100%
  beforeEach(async function () {
    didToken = await DIDToken.new()
    didToken.issueDID(accounts[0], 200)
    distense = await Distense.new(didToken.address)
  })


  it.only(`should restrict voting again if the votingInterval hasn't passed`, async function () {

    let contractError

    try {

      const userBalance = await didToken.balances.call(accounts[0])
      assert.isAbove(userBalance, 0, 'user should have DID here to vote')

      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value + 123
      )

      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value + 1
      )

    } catch (error) {
      contractError = error
      // assertJump(error)
    }

    assert.notEqual(
      contractError,
      undefined,
      'asdf'
    )

  })


})
