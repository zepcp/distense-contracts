require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'/*,
      gas: 8000000*/
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: 5777
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    ropstenFast: {
      host: '159.89.135.56',
      network_id: '3',
      port: 5000, 
      from: '0x80e774718b3781d4527f0ecb0751074778870800',
      gas: 4605201,
      gasPrice: 100000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
