const DIDToken = artifacts.require('./DIDToken.sol')

module.exports = (deployer, network, accounts) => {
  DIDToken.deployed().then(async didToken => {
    if (!process.env.TESTING) {
      const initialDIDIssuances = {
        '0x0de5be0e82493accb8e83d2af99e72458249bbf9': 213000000000000000000000,
        '0x19eDf992930Ad41Ec5B5aB0F1719421b17246C81': 24000000000000000000000,
        '0x0735b34a9eb4d4CbE656919146D6B7a8807F789C': 1851000000000000000000,
        '0xDf4D6296E697B9B9204b5FAf63a53c6e5f02d42B': 1150000000000000000000,
        '0x3f521dd5f87d098430b784a849b4d9797a6b9a86': 12000000000000000000000,
        '0x4276a3a29df04cd912317d4df305f8143c82d701': 380000000000000000000, // Tanmay
        '0x42661f8593C3172Ae923A4951569831ACb091719': 301000000000000000000,
        '0xd3a5b00da240e374f0278eb0f34a4fa2b71e24b8': 221000000000000000000,
        '0x29B4530Afa9C524344Aa6eAdffE79faC9Ad8B48f': 3000000000000000000000, // Brad
        '0x23bB837Fe8661f401F5a3462B108A120B45bA6bD': 300000000000000000000, //  Vikas
        '0xA9f570d8F799C7770021DfE6A58Fb91773F9a14F': 250000000000000000000,
        '0x0008c891ac2A5A8c45a36a9D9b9da13c73372281': 1200000000000000000000,
        '0x05da2ff5ab8f87d06c5234315e9e35a6b89636e2': 500000000000000000000
      }

      Object.keys(initialDIDIssuances).forEach(async account => {
        const numDID = initialDIDIssuances[account]
        console.log(`Issuing ${numDID} mock DID to contributor: ${account}`)
        await didToken.issueDID(account, numDID)
        const balance = await didToken.balances.call(account)
        console.log(`Contributor's post-issuance balance: ${balance}`)
      })
    }
  })
}
