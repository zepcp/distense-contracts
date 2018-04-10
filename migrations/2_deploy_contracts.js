const DIDToken = artifacts.require('./DIDToken.sol')
const Distense = artifacts.require('./Distense.sol')
const PullRequests = artifacts.require('./PullRequests.sol')
const Tasks = artifacts.require('./Tasks.sol')
const SafeMath = artifacts.require('./SafeMath.sol')
const SafeMathMock = artifacts.require('./SafeMathMock')
const Faucet = artifacts.require('./Faucet')

const safeMathAddress = '0xec9D002F3c724A44038981cb0CD967b008681b64'
const tasksAddress = '0x79df04e7cfa3d710dcec830d7fa0d78b6e3977ee'
const didTokenAddress = ''
const distenseAddress = '0xa6cb391a49899d2e6c3bd9c0308eb010b55125ca'
const pullRequestsAddress = '0x5e45C54AE11c5397fed4FD4B6C49a3514acc3b84'

module.exports = (deployer, network, accounts) => {
  deployer
    .deploy(SafeMath)
    .then(() => {
      deployer.link(SafeMath, [DIDToken, SafeMathMock, Tasks, Distense])
    })
    .then(() => {
      return deployer.deploy(DIDToken)
    })
    .then(() => {
      return DIDToken.deployed()
    })
    .then(() => {
      return deployer.deploy(Distense, DIDToken.address)
    })
    .then(() => {
      return deployer.deploy(Tasks, DIDToken.address, Distense.address)
    })
    .then(() => {
      return deployer.deploy(
        PullRequests,
        DIDToken.address,
        Distense.address,
        Tasks.address
      )
    })
    .then(() => {
      return Tasks.deployed()
    })
    .then(async tasks => {
      await tasks.approve(PullRequests.address)
      const isApproved = await tasks.approved.call(PullRequests.address)
      if (isApproved)
        console.log(`PullRequests address now Tasks contract approved`)
      else console.log(`Failed to approve PullRequests address`)
    })
    .then(() => {
      return DIDToken.deployed()
    })
    .then(async didToken => {
      const pullRequests = await PullRequests.deployed()
      await didToken.approve(pullRequests.address)
      await didToken.approved.call(pullRequests.address)
      await didToken.setDistenseAddress(Distense.address)
    })
    .then(() => {
      const network = web3.version.network
      console.log(`Using network: ${network}`)
      if (network === 3) {
        console.log(`Deploying Ropsten faucet`)
        return deployer.deploy(Faucet)
      } else {
        console.log(
          `won't deploy Ropsten faucet because not on correct network`
        )
      }
    })
    .then(async () => {
      //  Ropsten faucet
      if (network === 3) {
        const faucet = await Faucet.deployed()
        const network = web3.version.network
        console.log(`Using network: ${network}`)
        const numEtherToSendToFaucet = network === 3 ? 1000 : 5
        console.log(`Sending ${numEtherToSendToFaucet} ether to faucet`)
        await web3.eth.sendTransaction({
          from: accounts[0],
          to: faucet.address,
          value: web3.toWei(numEtherToSendToFaucet, 'ether')
        })
      }
    })
    .catch(err => {
      console.log(`error: ${err}`)
    })
}
