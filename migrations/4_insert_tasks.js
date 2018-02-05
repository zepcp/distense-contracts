const insertGithubIssuesAsTasks = require('./helpers/insert_github_issues_as_tasks')
const Tasks = artifacts.require('./Tasks.sol')

module.exports = (deployer, network, accounts) => {
  Tasks.deployed()
    .then(async tasks => {
      if (process.env.TESTING) {
        console.log(`Testing so not inserting Github issues as tasks`)
      } else {
        console.log(
          `Not testing so will insert Github issues as Distense tasks`
        )
        await insertGithubIssuesAsTasks(tasks, accounts)
      }
    })
    .catch(err => {
      console.log(`error: ${err}`)
    })
}
