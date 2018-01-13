const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const convertBytes32ToString = require('./helpers/utils')
const assertJump = require('./helpers/assertJump')

import {
  convertIntToSolidityInt,
  convertSolidityIntToInt
} from './helpers/utils'

contract('Distense contract', function (accounts) {

  const proposalPctDIDToApproveParameter = {
    title: 'proposalPctDIDToApprove',
    value: 25 // CLIENT VALUE (not multiplied by 10) Hard coded in constructor function in contract
  }

  const pullRequestPctDIDParameter = {
    title: 'pctDIDRequiredToMergePullRequest',
    // Hard coded in constructor function in contract
    // CLIENT VALUE (not multiplied by 10)
    value: 10
  }

  const votingIntervalParameter = {
    title: 'votingInterval',
    // Equal to 15 days in Solidity
    // CLIENT VALUE (not multiplied by 10)
    value: 1296000
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
    assert.equal(param[1].toNumber(), proposalPctDIDToApproveParameter.value)
  })


  it('should set the initial attributes correctly', async function () {
    const numParameters = await distense.getNumParameters.call()
    assert.equal(numParameters.toNumber(), 8)
  })


  it('should reject parameter votes with values equal to the current value', async function () {

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
      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value
      )
    } catch (error) {
      votingIntervalParameterError = error
    }
    assert.notEqual(votingIntervalParameterError, undefined, 'Error must be thrown')


  })


  it(`should disallow voting for those who don't own DID`, async function () {
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

  //  Begin accounts[0] owns 2000 or 100%
  let didToken
  let distense

  beforeEach(async function () {
    didToken = await DIDToken.new()
    didToken.issueDID(accounts[0], 2000)
    distense = await Distense.new(didToken.address)
  })


  it(`should restrict voting again if the votingInterval hasn't passed`, async function () {

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


  it(`should allow voting only after the votingInterval has passed`, async function () {

    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(userBalance, 0, 'user should have DID here to vote')

    let contractError
    try {


      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value + 123
      )

      // increaseTime(1)
      await distense.voteOnParameter(
        votingIntervalParameter.title,
        votingIntervalParameter.value + 1
      )

    } catch (error) {
      // assertJump(error)
      contractError = error
    }

    assert.notEqual(
      contractError,
      undefined,
      'should throw an error because the voter is trying to vote twice'
    )

  })

  it(`should properly update the votingInterval parameter value when voted upon with the proper requirements`, async function () {

    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(userBalance.toNumber(), convertSolidityIntToInt(2000), 'user should have DID here to vote')

    await distense.voteOnParameter(
      votingIntervalParameter.title,
      votingIntervalParameter.value * 2
    )

    const newValue = await distense.getParameterValueByTitle(votingIntervalParameter.title)

    assert.equal(
      convertSolidityIntToInt(newValue.toNumber()),
      votingIntervalParameter.value * 2,
      'updated value should be twice the original value as the voter owns 100% of the DID'
    )

  })

  it(`should properly update the pullRequestPctDIDParameter value when voted upon with the proper requirements`, async function () {

    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(userBalance.toNumber(), convertSolidityIntToInt(2000), 'user should have DID here to vote')

    await distense.voteOnParameter(
      pullRequestPctDIDParameter.title,
      pullRequestPctDIDParameter.value * 1.1
    )

    const newValue = await distense.getParameterValueByTitle(pullRequestPctDIDParameter.title)

    assert.equal(
      convertSolidityIntToInt(newValue.toNumber()),
      pullRequestPctDIDParameter.value * 1.1,
      'updated value should be 10% greater than the original value as the voter owns 100% of the DID'
    )

  })

  it.only(`should properly update the votingInterval parameter value when voted upon with the proper requirements`, async function () {

    const userBalance = await didToken.balances.call(accounts[0])
    assert.isAbove(userBalance.toNumber(), convertSolidityIntToInt(2000), 'user should have DID here to vote')

    console.log(`original param value: ${proposalPctDIDToApproveParameter.value}`)
    const voteValue = proposalPctDIDToApproveParameter.value * .47
    await distense.voteOnParameter(
      proposalPctDIDToApproveParameter.title,
      voteValue
    )

    const newValue = await distense.getParameterValueByTitle(proposalPctDIDToApproveParameter.title)

    console.log(`newValue.toNumber(): ${newValue.toNumber()}`)
    console.log(`voteValue: ${voteValue}`)
    assert.equal(
      convertSolidityIntToInt(newValue.toNumber()),
      voteValue,
      'updated value should be 47% of the original value'
    )

  })
})

const increaseTime = addSeconds => {
  web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds], id: 0
  })
}

