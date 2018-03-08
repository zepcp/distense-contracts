const BigNumber = require('bignumber.js')

module.exports.stripHexStringOfZeroes = function(stg) {
  return web3.toAscii(stg).replace(/\u0000/g, '')
}

module.exports.convertIntToSolidityInt = function(integer) {
  return new BigNumber(integer).times(100)
}

module.exports.convertSolidityIntToInt = function(integer) {
  return new BigNumber(integer).div(100)
}
