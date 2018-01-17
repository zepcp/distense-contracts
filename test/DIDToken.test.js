const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('./Distense.sol')
const web3Utils = require('web3-utils')
const didPerEtherParameter = require('./Distense.test')

const utils = require('./helpers/utils')


contract('DIDToken', function (accounts) {

  let didToken
  let distense

  beforeEach(async function () {
    distense = await Distense.new()
    didToken = await DIDToken.new(distense.address)
  })

  it('should set the initial attributes correctly', async function () {
    assert.equal(await didToken.totalSupply(), 0)
    assert.equal(await didToken.name(), 'Distense DID')
    assert.equal(await didToken.symbol(), 'DID')
    assert.equal(await didToken.decimals(), 18)
  })

  it('should issueDID correctly', async function () {

    await didToken.issueDID(accounts[0], 4321)
    let newSupply = await didToken.totalSupply()
    assert.equal(newSupply, 4321)

    await didToken.issueDID(accounts[0], 112340876)
    newSupply = await didToken.totalSupply()
    assert.equal(newSupply.toNumber(), 112345197)

  })

  it('should disallow issueDID from an empty address', async function () {
    let addError
    try {
      //contract throws error here
      await didToken.issueDID(accounts[5], 1234, {
        from: ''
      })
    } catch (error) {
      addError = error
    }
    assert.notEqual(addError, undefined, 'Error must be thrown')
  })

  it('should allow issueDID from owner', async function () {
    let addError
    try {
      //contract throws error here
      await didToken.issueDID(accounts[5], 9100, {
        from: accounts[0]
      })
    } catch (error) {
      addError = error
    }
    assert.equal(addError, undefined, 'Error must not be thrown')
    assert.equal(await didToken.balances.call(accounts[5]), 9100)
  })

  it('should disallow an issueDID call for === 0', async function () {
    let addError
    try {
      //contract throws error here
      await didToken.issueDID(accounts[5], 0, {
        from: accounts[0]
      })
    } catch (error) {
      addError = error
    }
    assert.notEqual(addError, undefined, 'Error must be thrown')
    assert.equal(
      await didToken.totalSupply(),
      0,
      'No DID should have been issued'
    )
  })

  it('should correctly calculate the percentDID someone owns', async function () {
    assert.equal(await didToken.totalSupply(), 0)
    await didToken.issueDID(accounts[0], 200)
    let percentDID = await didToken.pctDIDOwned(accounts[0])
    assert.equal(percentDID.toString(), 1000)

    await didToken.issueDID(accounts[1], 100)
    percentDID = await didToken.pctDIDOwned(accounts[1])
    assert.equal(percentDID.toString(), 333)

    await didToken.issueDID(accounts[1], 100)
    percentDID = await didToken.pctDIDOwned(accounts[1])
    assert.equal(percentDID.toString(), 500)
  })

  it('should throw an error when someone tries to exchange DID for ether who doesn\'t own DID', async function () {

    let exchangeError
    try {

      //  accounts[1] has no DID so this should fail/throw an error
      assert.equal(await didToken.balances.call(accounts[1]), 0, 'accounts[1] must own 0 DID for this test to properly fail')
      assert.equal(await didToken.balances.call(accounts[1]), 0, 'accounts[1] must own 0 DID for this test to properly fail')
      await didToken.exchangeDIDForEther({
        from: accounts[1],
        value: web3.toWei(2)
      })

    } catch (error) {
      exchangeError = error
    }
    assert.notEqual(exchangeError, undefined, 'Error should be thrown')

  })

  it('should allow an address that owns sufficient DID to exchange 2 ether for DID', async function () {

    let etherForDIDExchangeError
    await didToken.issueDID(accounts[0], 20000)

    try {

      await didToken.depositEtherForDID({
        from: accounts[0],
        value: web3.toWei(2)
      })

    } catch (error) {
      etherForDIDExchangeError = error
      console.error(`etherForDIDExchangeError: ${etherForDIDExchangeError}`)
    }

    const tasksEtherBalance = await web3.eth.getBalance(didToken.address).toNumber()
    assert.equal(tasksEtherBalance, web3.toWei(2), `Contracts ether balance should be 2`)
    assert.equal(etherForDIDExchangeError, undefined, 'Error should not be thrown')

  })

  it('should increment the number of DID for those who invest ether', async function () {

    let etherForDIDExchangeError
    await didToken.issueDID(accounts[0], 20000)
    const preInvestDIDBalance = await didToken.balances.call(accounts[0])
    const etherToInvest = 2

    try {

      await didToken.investEtherForDID({}, {
        from: accounts[0],
        value: web3.toWei(etherToInvest, 'ether')
      })

    } catch (error) {
      etherForDIDExchangeError = error
      console.error(`etherForDIDExchangeError: ${etherForDIDExchangeError}`)
    }

    const postInvestDIDBalance = await didToken.balances.call(accounts[0])

    const didPerEther = await distense.getParameterValueByTitle('didPerEther')
    assert.equal(didPerEther, 1000, 'make sure didPerEther is still 1000')

    assert.isAbove(postInvestDIDBalance.toNumber(), preInvestDIDBalance, 'accounts[0] DID balance should be higher after investing ether')
    assert.equal(
      postInvestDIDBalance.toNumber(),
      preInvestDIDBalance.toNumber() + (didPerEther * etherToInvest),
      'accounts[0] DID balance should be higher after investing ether')
  })

})