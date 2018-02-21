const DIDToken = artifacts.require('./DIDToken.sol')

module.exports = (deployer, network, accounts) => {
  DIDToken.deployed().then(async didToken => {
    if (!process.env.TESTING) {
      const initialDIDIssuances = {
        '0x0de5be0e82493accb8e83d2af99e72458249bbf9': 87300,
        '0x19eDf992930Ad41Ec5B5aB0F1719421b17246C81': 20000,
        '0x0735b34a9eb4d4CbE656919146D6B7a8807F789C': 650,
        '0xDf4D6296E697B9B9204b5FAf63a53c6e5f02d42B': 50,
        '0x3f521dd5f87d098430b784a849b4d9797a6b9a86': 1000,
        '0x4276a3a29df04cd912317d4df305f8143c82d701': 180, // Tanmay
        '0x42661f8593C3172Ae923A4951569831ACb091719': 100,
        '0xd3a5b00da240e374f0278eb0f34a4fa2b71e24b8': 120,
        '0x29B4530Afa9C524344Aa6eAdffE79faC9Ad8B48f': 100, // Brad
        '':
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
