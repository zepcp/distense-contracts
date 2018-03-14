const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const utils = require('./helpers/utils')

import { convertSolidityIntToInt } from './helpers/utils'

contract('Distense contract', function(accounts) {
  const pctDIDToDetermineTaskRewardParameter = {
    title: 'pctDIDToDetermineTaskReward',
    value: 2500
  }

  const pctDIDRequiredToMergePullRequest = {
    title: 'pctDIDRequiredToMergePullRequest',
    // Hard coded in constructor function in contract
    // CLIENT VALUE (not multiplied by 10)
    value: 1000
  }

  const votingIntervalParameter = {
    title: 'votingInterval',
    // Equal to 15 days in Solidity
    value: 1296000
  }

  const maxRewardParameter = {
    title: 'maxReward',
    value: 5000
  }

  const numDIDRequiredToApproveVotePullRequestParameter = {
    title: 'numDIDReqApproveVotePullRequest',
    value: 200
  }

  const numDIDRequiredToTaskRewardVoteParameter = {
    title: 'numDIDRequiredToTaskRewardVote',
    value: 100
  }

  const minNumberOfTaskRewardVotersParameter = {
    title: 'minNumberOfTaskRewardVoters',
    value: 7
  }

  const numDIDRequiredToAddTaskParameter = {
    title: 'numDIDRequiredToAddTask',
    value: 100
  }

  const defaultRewardParameter = {
    title: 'defaultReward',
    value: 100
  }

  const didPerEtherParameter = {
    title: 'didPerEther',
    value: 1000
  }

  const votingPowerLimitParameter = {
    title: 'votingPowerLimit',
    value: 2000
  }

  it('should have the correct pctDIDToDetermineTaskRewardParameter title and value', async () => {
    const param = await distense.getParameterByTitle(
      pctDIDToDetermineTaskRewardParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      pctDIDToDetermineTaskRewardParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      pctDIDToDetermineTaskRewardParameter.value,
      'proposalPctDIDToApproveParameter value incorrect'
    )
  })

  it('should have the correct pctDIDRequiredToMergePullRequest title and value', async () => {
    let param = await distense.getParameterByTitle(
      pctDIDRequiredToMergePullRequest.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      pctDIDRequiredToMergePullRequest.title
    )
    assert.equal(
      param[1].toNumber(),
      pctDIDRequiredToMergePullRequest.value,
      'pctDIDRequiredToMergePullRequest value incorrect'
    )
  })

  it('should have the correct votingIntervalParameter title and value', async () => {
    let param = await distense.getParameterByTitle(
      votingIntervalParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      votingIntervalParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      votingIntervalParameter.value,
      ' value incorrect'
    )
  })

  it('should have the correct maxRewardParameter title and value', async () => {
    let param = await distense.getParameterByTitle(maxRewardParameter.title)
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      maxRewardParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      maxRewardParameter.value,
      'maxRewardParameter value incorrect'
    )
  })

  it('should have the correct numDIDRequiredToApproveVotePullRequestParameter title and value', async () => {
    let param = await distense.getParameterByTitle(
      numDIDRequiredToApproveVotePullRequestParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      numDIDRequiredToApproveVotePullRequestParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      numDIDRequiredToApproveVotePullRequestParameter.value,
      'numDIDRequiredToApproveVotePullRequestParameter value incorrect'
    )
  })

  it('should have the correct numDIDRequiredToTaskRewardVoteParameter title and value', async () => {
    let param = await distense.getParameterByTitle(
      numDIDRequiredToTaskRewardVoteParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      numDIDRequiredToTaskRewardVoteParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      numDIDRequiredToTaskRewardVoteParameter.value,
      'numDIDRequiredToTaskRewardVoteParameter value incorrect'
    )
  })

  it('should have the correct minNumberOfTaskRewardVotersParameter title and value', async () => {
    let param = await distense.getParameterByTitle(
      minNumberOfTaskRewardVotersParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      minNumberOfTaskRewardVotersParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      minNumberOfTaskRewardVotersParameter.value,
      'minNumberOfTaskRewardVotersParameter value incorrect'
    )
  })

  it('should have the correct votingPowerLimit title and value', async () => {
    let param = await distense.getParameterByTitle(
      votingPowerLimitParameter.title
    )
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      votingPowerLimitParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      votingPowerLimitParameter.value,
      'votingPowerLimitParameter value incorrect'
    )
  })

  it('should have the correct numDIDRequiredToAddTaskParameter correctly', async function() {
    let param = await distense.getParameterByTitle(
      numDIDRequiredToAddTaskParameter.title
    )

    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      numDIDRequiredToAddTaskParameter.title
    )
    assert.equal(param[1].toNumber(), numDIDRequiredToAddTaskParameter.value)
  })

  it('should have the correct defaultRewardParameter title and value', async () => {
    let param = await distense.getParameterByTitle(defaultRewardParameter.title)
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      defaultRewardParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      defaultRewardParameter.value,
      'defaultRewardParameter value incorrect'
    )
  })

  it('should have the correct didPerEtherParameter title and value', async () => {
    let param = await distense.getParameterByTitle(didPerEtherParameter.title)
    assert.equal(
      utils.stripHexStringOfZeroes(param[0]),
      didPerEtherParameter.title
    )
    assert.equal(
      param[1].toNumber(),
      didPerEtherParameter.value,
      'didPerEtherParameter value incorrect'
    )
  })

  it('should set the initial attributes correctly', async function() {
    const numParameters = await distense.getNumParameters.call()
    assert.equal(numParameters.toNumber(), 11)
  })

  it('should reject parameter votes with values equal to the current value', async function() {
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

    let votingIntervalParameterError
    try {
      await distense.voteOnParameter(params[2].title, params[2].value)
    } catch (error) {
      votingIntervalParameterError = error
    }
    assert.notEqual(
      votingIntervalParameterError,
      undefined,
      'Error must be thrown'
    )
  })

  it(`should disallow voting for those who don't own DID`, async function() {
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
      "reject parameter votes from those who don't own DID"
    )
  })

  //  Begin accounts[0] owns 2000 or 100%
  let didToken
  let distense

  beforeEach(async function() {
    didToken = await DIDToken.new()
    didToken.issueDID(accounts[0], 2000)
    distense = await Distense.new(didToken.address)
  })

  it(`should restrict voting again if the votingInterval hasn't passed`, async function() {
    let contractError

    try {
      const userBalance = await didToken.balances.call(accounts[0])
      assert.isAbove(userBalance, 0, 'user should have DID here to vote')

      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value + 1
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
      'should throw an error because the voter is trying to vote twice'
    )
  })

  it(`should allow voting only after the votingInterval has passed`, async function() {
    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(userBalance, 0, 'user should have DID here to vote')

    let contractError
    try {
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
    }

    assert.notEqual(
      contractError,
      undefined,
      'should throw an error because the voter is trying to vote twice'
    )
  })

  it(`should properly update the votingInterval parameter value when voted upon with the proper requirements`, async function() {
    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(
      userBalance.toNumber(),
      convertSolidityIntToInt(2000),
      'user should have DID here to vote'
    )

    await distense.voteOnParameter(votingIntervalParameter.title, 1)

    const newValue = await distense.getParameterValueByTitle.call(
      votingIntervalParameter.title
    )

    assert.equal(
      newValue.toNumber(),
      votingIntervalParameter.value * 1.25, // limited to 25% increase
      'updated value should be twice the original value as the voter owns 100% of the DID'
    )
  })

  it(`should properly update the pctDIDRequiredToMergePullRequest value when upvoted with the proper requirements`, async function() {
    const userBalance = await didToken.balances.call(accounts[0])
    assert.equal(
      userBalance.toNumber(),
      2000,
      'user should have DID here to vote'
    )

    await distense.voteOnParameter(pctDIDRequiredToMergePullRequest.title, -1)

    const newValue = await distense.getParameterValueByTitle(
      pctDIDRequiredToMergePullRequest.title
    )

    assert.equal(
      newValue.toNumber(),
      pctDIDRequiredToMergePullRequest.value * 0.75,
      'updated value should be 25% less than the original value'
    )
  })

  function calcCorrectUpdatedParameterValue(pctDIDOwned, originalValue, vote) {
    const limitTo25PercentIfHigher = (pctDIDOwned > 25 ? 25 : pctDIDOwned) / 100

    const update = originalValue * limitTo25PercentIfHigher
    if (vote === 1) originalValue += update
    else originalValue -= update

    return originalValue
  }

  it(`should properly update the proposalPctDIDToApproveParameter value`, async function() {
    await didToken.issueDID(accounts[1], 2000)

    let newContractValue
    let correctValue
    let vote
    let pctDIDOwned

    //  Downvote by 50% owner -- should be limited to 25% down from original value of 25%
    pctDIDOwned = convertSolidityIntToInt(
      await didToken.pctDIDOwned(accounts[0])
    )
    vote = -1
    await distense.voteOnParameter(
      pctDIDToDetermineTaskRewardParameter.title,
      vote
    )
    correctValue = calcCorrectUpdatedParameterValue(
      pctDIDOwned,
      pctDIDToDetermineTaskRewardParameter.value,
      vote
    )

    newContractValue = await distense.getParameterValueByTitle(
      pctDIDToDetermineTaskRewardParameter.title
    )

    assert.equal(
      newContractValue,
      correctValue,
      'updated value should be lower by the percentage of DID ownership of the voter'
    )
  })

  it(`should properly update the pctDIDToDetermineTaskRewardParameter value`, async function() {
    await didToken.issueDID(accounts[1], 2000)
    await didToken.issueDID(accounts[2], 2000)

    let vote = -1
    //  total DID at this point is 2000 + 2000 + 4321 == 8321 DID
    //  so accounts[0], the voter owns 24%
    await distense.voteOnParameter(
      pctDIDToDetermineTaskRewardParameter.title,
      vote
    )

    let newContractValue = await distense.getParameterValueByTitle(
      pctDIDToDetermineTaskRewardParameter.title
    )
    assert.equal(
      newContractValue,
      1875,
      'updated value should be lower by the percentage of DID ownership of the voter'
    )

    await didToken.issueDID(accounts[3], 2000)

    vote = 1
    // //  total DID at this point is 2000 + 2000 + 4321 == 8321 DID
    // //  so accounts[0], the voter owns 24%
    await distense.voteOnParameter(
      pctDIDToDetermineTaskRewardParameter.title,
      vote,
      {
        from: accounts[1]
      }
    )
    newContractValue = await distense.getParameterValueByTitle(
      pctDIDToDetermineTaskRewardParameter.title
    )
    assert.equal(
      newContractValue,
      2343,
      'updated value should be higher by the percentage of DID ownership of the voter'
    )

    await didToken.issueDID(accounts[4], 2000)
    vote = 1
    // //  total DID at this point is 2000 + 2000 + 4321 == 8321 DID
    // //  so accounts[0], the voter owns 24%
    await distense.voteOnParameter(
      pctDIDToDetermineTaskRewardParameter.title,
      vote,
      {
        from: accounts[2]
      }
    )
    newContractValue = await distense.getParameterValueByTitle(
      pctDIDToDetermineTaskRewardParameter.title
    )
    assert.equal(
      newContractValue,
      2928,
      'updated value should be higher by the percentage of DID ownership of the voter'
    )
  })
})
