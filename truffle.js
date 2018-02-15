require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 8000000
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
    rinkebyLocal: {
      host: 'localhost',
      network_id: '4',
      port: 4000,
      gas: 6719227,
      gasPrice: 50000000000
    },
    rinkebyRemote: {
      host: '159.89.135.56',
      network_id: '4',
      port: 4000,
      from: '0x0de5be0e82493accb8e83d2af99e72458249bbf9',
      gas: 6719227,
      gasPrice: 100000000000
    },
    ropstenRemote: {
      host: '192.168.1.104',
      network_id: '3',
      port: 8545,
      from: '0x80e774718b3781d4527f0ecb0751074778870800',
      gas: 4704201,
      gasPrice: 10000000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
