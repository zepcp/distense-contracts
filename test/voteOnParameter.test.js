const web3 = global.web3
const DIDToken = artifacts.require('DIDToken')
const Distense = artifacts.require('Distense')
const utils = require('./helpers/utils')

import { convertSolidityIntToInt } from './helpers/utils'


const params = [{
  title: 'proposalPctDIDToApprove',
  value: 25 // CLIENT VALUE (not multiplied by 10) Hard coded in constructor function in contract
}, {
  title: 'pctDIDRequiredToMergePullRequest',
  // Hard coded in constructor function in contract
  // CLIENT VALUE (not multiplied by 10)
  value: 10
}, {
  title: 'votingInterval',
  // Equal to 15 days in Solidity
  // CLIENT VALUE (not multiplied by 10)
  value: 1296000
}, {
  title: 'didPerEther',
  value: 1000 // CLIENT VALUE (not multiplied by 10) Hard coded in constructor function in contract
}
]

async function itShouldProperlyUpdateParameterValues() {

  const randomParam = params[Math.floor(Math.random() * params.length)]

  const didToken = await DIDToken.new()
  const distense = await Distense.new(didToken.address)

  const numberOfDIDIssuances = Math.floor(Math.random() * Math.floor(7))
  for (let i = 0; i <= numberOfDIDIssuances; i++) {
    const didAmount = Math.round(1000 * i + (Math.random() * (1 + Math.random())))
    await didToken.issueDID(accounts[i], didAmount)
  }

  const percentageOwnershipOfVoter = await didToken.pctDIDOwned(accounts[0])
  const upOrDownVote = Math.random() < .5 ? -1 : 1

  it(`should properly update the ${randomParam.title} param`, async function () {
    await distense.voteOnParameter(
      randomParam.title,
      upOrDownVote
    )

    const update = percentageOwnershipOfVoter * randomParam.value
    console.log(`update is: ${update}`)
    let correctValue
    if (upOrDownVote) correctValue = randomParam.value + (randomParam.value + update)
    else correctValue = randomParam.value - (randomParam.value + update)
    console.log(`correctValue is: ${correctValue}`)

    const contractUpdatedValue = convertSolidityIntToInt(await distense.getParameterValueByTitle(proposalPctDIDToApproveParameter.title))
    console.log(`Updated value in contract is: ${contractUpdatedValue}`)
    assert.equal(
      contractUpdatedValue,
      correctValue,
      'updated value should be lower by the percentage of DID ownership of the voter'
    )
  })

}

for (let i = 0; i <= 25; i++) {
  itShouldProperlyUpdateParameterValues()
}