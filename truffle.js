module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4600000,
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: 5777,
    },
    distnet: {
      host: '165.227.180.132',
      port: 9000,
      network_id: 9000,
      from: '0x014EB296Ef422dEbb71E43cB9c447306C536F05d',
      gas: 4650000
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555, // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01 // <-- Use this low gas price
    }
  },
mocha: {
	slow: 200
}
}
