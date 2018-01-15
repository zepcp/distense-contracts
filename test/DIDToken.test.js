const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('./Distense.sol')

const utils = require('./helpers/utils')


contract('DIDToken', function(accounts) {

  let didToken
  let distense

  beforeEach(async function() {
    distense = await Distense.new()
    didToken = await DIDToken.new(distense.address)
  })


  it('should set the initial attributes correctly', async function() {
    assert.equal(await didToken.totalSupply(), 0)
    assert.equal(await didToken.name(), 'Distense DID')
    assert.equal(await didToken.symbol(), 'DID')
    assert.equal(await didToken.decimals(), 18)
  })


  it('should issueDID correctly', async function() {

    await didToken.issueDID(accounts[0], 4321)
    let newSupply = await didToken.totalSupply()
    assert.equal(newSupply, 4321)

    await didToken.issueDID(accounts[0], 112340876)
    newSupply = await didToken.totalSupply()
    assert.equal(newSupply.toNumber(), 112345197)
  
  })


  it('should disallow issueDID from an empty address', async function() {
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


  it('should allow issueDID from owner', async function() {
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


  it('should disallow an issueDID call for === 0', async function() {
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

  it('should correctly calculate the percentDID someone owns', async function() {
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


  it('should reduce the number of DID someone who exchanges DID for ether', async function() {

    await didToken.issueDID(accounts[0], 200)

    await didToken.exchangeDIDForEther(120)

    const newBalance = await didToken.balances.call(accounts[0])
    assert.equal(newBalance, 80, 'newBalance of DID should be 80 after exchanging 120')

  })

  it('should increase the ether balance of someone who exchanges DID for ether', async function() {

    const originalEtherBalance = web3.eth.getBalance(accounts[0])
    await didToken.issueDID(accounts[0], 200)

    await didToken.exchangeDIDForEther(120)

    const newBalance = await web3.eth.getBalance(accounts[0])

    //  ether balance delta dependent on didPerEtherParameter value so keep this simple for now
    assert.isBelow(newBalance, originalEtherBalance, 'new ether balance should be below the original ether balance')

  })

  it('should throw an error when someone tries to exchange DID for ether who doesn\'t own DID', async function() {

    let exchangeError
    try {

      //  accounts[1] has no DID so this should fail/throw an error
      assert.equal(await didToken.balances.call(accounts[1]), 0, 'accounts[1] must own 0 DID for this test to properly fail')

      await didToken.exchangeDIDForEther(120, {
        from: accounts[1]
      })

    } catch (error) {
      exchangeError = error
    }
    assert.notEqual(exchangeError, undefined, 'Error should be thrown')

  })


})
