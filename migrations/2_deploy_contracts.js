const DIDToken = artifacts.require('./DIDToken.sol')
const Distense = artifacts.require('./Distense.sol')
const PullRequests = artifacts.require('./PullRequests.sol')
const Tasks = artifacts.require('./Tasks.sol')
const SafeMath = artifacts.require('./SafeMath.sol')
const SafeMathMock = artifacts.require('./SafeMathMock')
// const mockData = require('./mockData')


module.exports = deployer => {
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
    .then(async(didToken) => {
      if (web3.version.network !== 1) {
        const initialDID = 5000
        console.log(`issuing ${initialDID} mock DID to accounts[0]: ${web3.eth.accounts[0]}`)
        await didToken.issueDID(web3.eth.accounts[0], initialDID)
        const balance = await didToken.balances.call(web3.eth.accounts[0])
        console.log(`coinbase balance: ${balance}`)
      }
      return
    })
    .then(() => {
      return deployer.deploy(Distense, DIDToken.address)
    })
    .then(() => {
      return deployer.deploy(Tasks, DIDToken.address, Distense.address)
    })
    .then(() => {
      return deployer.deploy(PullRequests, Tasks.address)
    })
    .catch(err => {
      console.log(`error: ${err}`)
    })
}
