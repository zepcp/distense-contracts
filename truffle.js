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
      from: '0x0De5Be0E82493AcCb8E83d2aF99E72458249bBF9',
      gas: 6719227,
      gasPrice: 70000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
