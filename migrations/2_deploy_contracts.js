const DIDToken = artifacts.require('./DIDToken.sol')
const Distense = artifacts.require('./Distense.sol')
const insertGithubIssuesAsTasks = require('./insert_github_issues_as_tasks')
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
    .then(async(didToken) => {

        const preLaunchDIDIssuance = {
          '0x8a70b1b5095715748b01a4a217c6ea49472489cb': 100000,
          '0x19eDf992930Ad41Ec5B5aB0F1719421b17246C81': 20000,
          '0x0735b34a9eb4d4CbE656919146D6B7a8807F789C': 1000,
          '0xDf4D6296E697B9B9204b5FAf63a53c6e5f02d42B': 500
        }
        Object.keys(preLaunchDIDIssuance).forEach(async (account) => {
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
          const balance = await didToken.balances.call(accounts[0])
          console.log(`Balance of accounts[0] now: ${balance}`)
          const pctDIDOwned = await didToken.pctDIDOwned.call(accounts[0]) / 10
          console.log(`pctDIDOwned of accounts[0] is: ${pctDIDOwned}`)
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
    .then(async (tasks) => {
      await tasks.approve(PullRequests.address)
      const isApproved = await tasks.approved.call(PullRequests.address)
      if (isApproved) console.log(`PullRequests address now Tasks contract approved`)
      else console.log(`Failed to approve PullRequests address`)

      await insertGithubIssuesAsTasks(tasks, accounts)

    })
    .then(() => {
      return DIDToken.deployed()
    })
    .then(async (didToken) => {
      await didToken.approve(PullRequests.address)
      await didToken.approved.call(PullRequests.address)
    })
    .catch(err => {
      console.log(`error: ${err}`)
    })
}
