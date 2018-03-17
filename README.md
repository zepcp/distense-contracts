# Distense Smart Contracts

[![codecov](https://codecov.io/gh/Distense/distense-contracts/branch/master/graph/badge.svg)](https://codecov.io/gh/Distense/distense-contracts)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/Distense/distense-contracts.svg?branch=master)](https://travis-ci.org/Distense/distense-contracts)
![Distense logo](https://i.imgur.com/W8XjeyS.png, 'Distense')

## Table of Contents

- [What is Distense?](#what-is-distense?)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## What is Distense?

Distense is a decentralized code cooperative: a company without executives, offices, meetings and bosses.  Every contributor to Distense earns DID, an Ethereum token.  There's no ICO, but code contributors may invest small amounts, initially.  Hodlers of DID govern Distense on a one-vote-per-DID basis.

- Follow us on [Twitter](https://twitter.com/distenseorg)
- Join our [Slack](https://join.slack.com/t/distense/shared_invite/enQtMzA4ODM5MzI5NzY2LWFmZDBhYTJjYzkzYmZjMjg0Y2I1YWZkYmU3NGIwYjE5NjA1Y2I0MDEzYjcyYjRmNGQzZmRhZjM1YmY0ZmY0OWY)
- Star this repo
- If you're interested in Solidity development, see our [frontend repo](https://github.com/Distense/distense-ui)

## Install

- clone this repo
- install npm if you don't have it
- `npm i`

## Usage

- the primary way we interact with our smart contracts is by testing, so when developing we make changes to our contracts, test, then interact in the UI
- to test run `npm test` (if this fails make sure you don't have another testrpc shell running)


Once you get past the initial code->testing phase and want to view your changes in the UI

- Install `ganache`, an application that is a local Ethereum testnet: Download the appropriate version from here: https://github.com/trufflesuite/ganache/releases
- run ganache
- Then you need to compile and deploy your updated version of the contracts: `npm run migrateLocal`
- Once your contracts are migrated you can install and run the distense-ui client to interact with them:
    - `git clone https://github.com/Distense/distense-ui`
    - `cd distense-ui`
    - `npm install`
- What we normally do at this point is remove the npm published version of our contracts from the distense-ui node_modules: `rm -r node_modules/distense-contracts`.
- Then you can symlink _your_ version of our contracts into the proper location in the client:
    - `sudo ln ~/distense-contracts ~/distense-ui/node_modules`
- Then you can run the distense-ui with `npm run start`
- You can interact with your version of the contracts at this point and modify the distense-ui if you want


## Contract Overview

The following is an overview of how Distense's smart contracts are structured.  

We have four primary contracts:

- Distense.sol
  - This contract is almost solely about Distense's governance parameters.  The original values are hardcoded in this file and the titles are also here.  When another contract checks the current value of a smart contract, it will query this smart contract.
  - This contract contains the DIDToken contract's address so it can query the percent of DID owned a voter has
- DIDToken.sol
  - This contract contains the important DID balances and functions that pertain to exchanging and investing ether for DID and vice versa.
- Tasks.sol
  - This contract contains the important `addTask` and `taskRewardVote` functions.  
    - `taskRewardVote` is so long because we effectively house the modifiers in this function within it to minimize the size of the call stack which would reach the limits if we didn't.
  - This contract queries Distense.sol like `distense.getParameterValueByTitle(distense.numDIDRequiredToTaskRewardVoteParameterTitle()));` quite a few times.    
- PullRequests.sol
  - This contract has quite the same functionality as Tasks.sol as far as adding and approving pullRequests
  - PullRequests.sol is where DID are issued once pullRequests reach an approval threshold.
  
  
 
  
      

## Contribute

- By contributing to this repo you will earn DID an Ethereum token that gives you governance and economic rights to Distense
    - See instructions on how to submit your work there

## License

All Rights Reserved © 2018 Distense
