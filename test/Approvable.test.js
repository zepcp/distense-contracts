const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Approvable = artifacts.require('Approvable')


contract('Approvable', function(accounts) {

  beforeEach(async function() {
    didToken = await DIDToken.new()
    approvable = await Approvable.new()
  })


  it('should set msg.sender to approved', async function() {
    const msgSenderApproved = await approvable.approved(accounts[0])
    assert.equal(msgSenderApproved , true, 'msg sender should be approved here')
  })

  it('other addresses should be initially approved', async function() {
    const msgSenderApproved = await approvable.approved(accounts[1])
    assert.equal(msgSenderApproved , false, 'msg sender should not be approved here')
  })

  it('set addresses as approved from only approved addresses', async function() {
    const msgSenderApproved = await approvable.approved(accounts[1])
    assert.equal(msgSenderApproved , false, 'msg sender should not be approved here')
  })

  it('should approve() addresses correctly', async function() {

    let msgSenderIsApproved = await approvable.approved(accounts[1])
    assert.equal(msgSenderIsApproved , false, 'msg sender should not be approved here')

    await approvable.approve(accounts[1])
    msgSenderIsApproved = await approvable.approved(accounts[1])
    assert.equal(msgSenderIsApproved , true, 'msg sender should be approved here')

  })

  it('set addresses as approved from only approved addresses', async function() {
    const msgSenderApproved = await approvable.approved(accounts[1])
    assert.equal(msgSenderApproved , false, 'msg sender should not be approved here')
  })

  // it('set addresses as approved from only approved addresses', async function() {
  //   const msgSenderApproved = await approvable.approved(accounts[1])
  //   assert.equal(msgSenderApproved , false, 'msg sender should not be approved here')
  // })

})
