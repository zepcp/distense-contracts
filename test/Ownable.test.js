const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Ownable = artifacts.require('Ownable')


contract('Ownable', function(accounts) {

  beforeEach(async function() {
    ownable = await Ownable.new()
  })


  it('should only allow the owner to do things when using onlyOwner', async function() {


    assert.equal(false, true, 'TODO')
  })


})
