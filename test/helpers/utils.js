module.exports = function(stg) {
  return web3.toAscii(stg).replace(/\u0000/g, '')
}

module.exports.convertIntToSolidityInt = function (integer) {
  return integer * 10
}

module.exports.convertSolidityIntToInt = function (integer) {
  return integer / 10
}