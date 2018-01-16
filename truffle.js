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
      port: 8555, // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01 // <-- Use this low gas price
    },
    rinkebyLocal: {
      host: 'localhost',
      network_id: '4',
      port: 4000,
      gas: 6719227,
      gasPrice: 50000000000
    },
    rinkebyRemote: {
      host: '165.227.180.132',
      network_id: '4',
      port: 9000,
      from: '0x0De5Be0E82493AcCb8E83d2aF99E72458249bBF9',
      gas: 6719227,
      gasPrice: 30000000000
    }
  },
  mocha: {
    slow: 500,
    useColors: true
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
