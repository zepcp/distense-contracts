const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const convertBytes32ToString = require('./helpers/utils')
const assertJump = require('./helpers/assertJump')

contract('Distense contract', function(accounts) {
  const proposalPctDIDToApproveParameter = {
    title: 'proposalPctDIDToApprove',
    value: 250 // Hard coded in constructor function in contract
  }

  const pullRequestPctDIDParameter = {
    title: 'pctDIDRequiredToMergePullRequest',
    // Hard coded in constructor function in contract
    //  Added 0 because Solidity's awesome
    value: 100
  }

  const votingIntervalParameter = {
    title: 'votingInterval',
    value: 1296000 // Equal to 15 days in Solidity
  }

  it('should set the initial attributes correctly', async function() {
    let param = await distense.getParameterByTitle(
      pullRequestPctDIDParameter.title
    )

    assert.equal(
      convertBytes32ToString(param[0]),
      pullRequestPctDIDParameter.title
    )
    assert.equal(param[1].toNumber(), pullRequestPctDIDParameter.value)
  })

  it('should set the proposalPctDIDApprovalParameter correctly', async function() {
    let param = await distense.getParameterByTitle(
      proposalPctDIDToApproveParameter.title
    )

    assert.equal(
      convertBytes32ToString(param[0].toString()),
      proposalPctDIDToApproveParameter.title
    )
    assert.equal(param[1], proposalPctDIDToApproveParameter.value)
  })

  it('should set the initial attributes correctly', async function() {
    const numParameters = await distense.getNumParameters.call()
    assert.equal(numParameters.toNumber(), 5)
  })

  it('should correctly throw errors for proposalPctDIDApproval votes with values equal to the current value', async function() {
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

  it('should correctly throw errors for pullRequestNumApprovalsParameter votes with values equal to the current value', async function() {
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

  it("should disallow voting for those who don't own DID", async function() {
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

  //  Begin accounts[0] owns 200 or 100%
  beforeEach(async function() {
    didToken = await DIDToken.new()
    didToken.issueDID(accounts[0], 200)
    distense = await Distense.new(didToken.address)
  })


  // it('should allow those who own DID to vote on parameters', async function() {
  //   let contractError
  //
  //   try {
  //     const userBalance = await didToken.balances.call(accounts[0])
  //     assert(userBalance > 0, 'Test should fail because user has no DID')
  //
  //     await distense.voteOnParameter.call(
  //       pullRequestPctDIDParameter.title,
  //       pullRequestPctDIDParameter.value + 1
  //     )
  //   } catch (error) {
  //     contractError = error
  //   }
  //
  //   assert.equal(
  //     contractError,
  //     undefined,
  //     'accept parameter votes from those who do own DID'
  //   )
  // })


  // it('should correctly calculate new ProposalApprovalPCTDID values', async function() {
  //   //  Voter has 100% so this should simply double the value
  //   const newValue = await distense.voteOnParameter.call(
  //     proposalPctDIDToApproveParameter.title,
  //     proposalPctDIDToApproveParameter.value * 2
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     votingIntervalParameter.value * 2,
  //     'failed to correctly calculate new ProposalApprovalPCTDID parameter values'
  //   )
  // })
  //
  // it('should correctly calculate new votingInterval values', async function() {
  //   //  Voter has 100% so this should simply double the value
  //   newValue = await distense.voteOnParameter.call(
  //     votingIntervalParameter.titit('should correctly calculate pullRequestNumApprovalsParameter values', async function() {
  //   //  Voter has 100% so this should simply double the value
  //   let newValue = await distense.voteOnParameter.call(
  //     pullRequestNumApprovalsParameter.title,
  //     4
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     4,
  //     'failed to correctly calculate new parameter values'
  //   )
  //
  //   //  Reset the value
  //   distense = await Distense.new(didToken.address)
  //
  //   newValue = await distense.voteOnParameter.call(
  //     pullRequestNumApprovalsParameter.title,
  //     10
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     10,
  //     'failed to correctly calculate new parameter values'
  //   )
  //
  //   await didToken.issueDID(accounts[1], 200) // accounts[0] now owns 50%
  //   assert.equal(
  //     await didToken.totalSupply.call(),
  //     400,
  //     'totalSupply should be 400'
  //   )
  //   //  Value is 10; 50% vote of double should move it 5
  //   newValue = await distense.voteOnParameter.call(
  //     pullRequestNumApprovalsParameter.title,
  //     20
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     15,
  //     'failed to correctly calculate new parameter values'
  //   )
  // })le,
  //     2
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     2,
  //     'failed to correctly calculate new votingInterval parameter values'
  //   )
  //
  //   // accounts[0] of the voter now owns 50%
  //   await didToken.issueDID(accounts[1], 200)
  //
  //   newValue = await distense.voteOnParameter.call(
  //     votingIntervalParameter.title,
  //     4
  //   )
  //
  //   assert.equal(
  //     newValue.toNumber(),
  //     3,
  //     'failed to correctly calculate new votingInterval parameter values'
  //   )
  // })

  // it('should restrict voting on parameters from happening more often than the votingInterval', async function() {
  //   let contractError
  //
  //   try {
  //     const userBalance = await didToken.balances.call(accounts[0])
  //     assert(userBalance > 0, 'User needs to have DID here')
  //
  //     // Vote first time to set lastVoted time: parameter.votes[msg.sender].lastVoted = now;
  //     await distense.voteOnParameter(
  //       pullRequestNumApprovalsParameter.title,
  //       pullRequestNumApprovalsParameter.value + 1
  //     )
  //
  //     await distense.voteOnParameter(
  //       pullRequestNumApprovalsParameter.title,
  //       pullRequestNumApprovalsParameter.value + 2
  //     )
  //     // assert.fail('Should fail on second vote for same parameters')
  //   } catch (error) {
  //     contractError = error
  //   }
  //
  //   assert.notEqual(
  //     contractError,
  //     undefined,
  //     'accept parameter votes from those who do own DID'
  //   )
  // })
})
