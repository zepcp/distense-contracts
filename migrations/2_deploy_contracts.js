const DIDToken = artifacts.require('./DIDToken.sol')
const Distense = artifacts.require('./Distense.sol')
const PullRequests = artifacts.require('./PullRequests.sol')
const Tasks = artifacts.require('./Tasks.sol')
const SafeMath = artifacts.require('./SafeMath.sol')
const SafeMathMock = artifacts.require('./SafeMathMock')

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
    .then(async didToken => {
      if (!process.env.TESTING) {
        const preLaunchDIDIssuance = {
          '': 153700,
          '0x19eDf992930Ad41Ec5B5aB0F1719421b17246C81': 20000,
          '0x0735b34a9eb4d4CbE656919146D6B7a8807F789C': 650,
          '0xDf4D6296E697B9B9204b5FAf63a53c6e5f02d42B': 50,
          '0x3f521dd5f87d098430b784a849b4d9797a6b9a86': 1000,
          '0x4276a3a29df04cd912317d4df305f8143c82d701': 150, // Tanmay
          '0x42661f8593C3172Ae923A4951569831ACb091719': 100, // Anonymous man
          '0xaefe3a22DEC89354576355f11b0E9D417371775C': 50 // anon Twitter
        }

        Object.keys(preLaunchDIDIssuance).forEach(async account => {
          const numDID = preLaunchDIDIssuance[account]
          console.log(`Issuing ${numDID} mock DID to contributor: ${account}`)
          await didToken.issueDID(account, numDID)
          const balance = await didToken.balances.call(account)
          console.log(`Contributor's post-issuance balance: ${balance}`)
        })

        const testNetAccount = '0x014eb296ef422debb71e43cb9c447306c536f05d'
        if (web3.version.network > 1) {
          await didToken.issueDID(testNetAccount, 23512)
          // Add some to accounts[0] in case we're using truffle or ganache
          await didToken.issueDID(accounts[0], 23512)
        }
      }
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

      await didToken.investEtherForDID(
        {},
        {
          from: accounts[0],
          value: web3.toWei(5, 'ether')
        }
      )
    })
    .catch(err => {
      console.log(`error: ${err}`)
    })
}
