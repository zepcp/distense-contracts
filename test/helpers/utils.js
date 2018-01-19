module.exports.stripHexStringOfZeroes = function(stg) {
  return web3.toAscii(stg).replace(/\u0000/g, '')
}

module.exports.convertIntToSolidityInt = function (integer) {
  return integer * 100
}

module.exports.convertSolidityIntToInt = function (integer) {
  return integer / 100
}