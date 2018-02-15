const web3 = global.web3
const Faucet = artifacts.require('Faucet')

const increaseTime = addSeconds => {
  web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds],
    id: 0
  })
}

contract('Faucet', async function(accounts) {
  let faucet
  beforeEach(async function() {
    faucet = await Faucet.new()
  })

  it('should send ether to the msg.sender', async function() {
    web3.eth.sendTransaction({
      from: accounts[0],
      to: faucet.address,
      value: web3.toWei('85.933', 'ether')
    })
    const beginBalance = await web3.eth.getBalance(accounts[0])

    increaseTime(20)
    await faucet.requestEther()
    const afterBalance = await web3.eth.getBalance(accounts[0])

    assert.isAbove(afterBalance.toNumber(), beginBalance)
  })
})
