const Git = require("nodegit")

import * as fs from "fs"
import * as util from "util"

const rmdir = util.promisify(fs.rmdir)
const writeFile = util.promisify(fs.writeFile)

async function GitTest() {
  await rmdir("test", { recursive: true })
  await Git.Clone.clone("https://github.com/whs-dot-hk/merge-test.git", "test", {
    fetchOpts: {
      callbacks: {
        certificateCheck: () => 0
      }
    }
  })

  const repository = await Git.Repository.open("test")

  const ourBranchName = "master"
  const theirBranchName = "refs/remotes/origin/add-exclamation-mark"

  const ourCommit = await repository.getBranchCommit(ourBranchName)
  const theirCommit = await repository.getBranchCommit(theirBranchName)

  const signature = Git.Signature.now("whs", "hswongac@gmail.com")

  try {
    await repository.mergeBranches(ourBranchName, theirBranchName, signature)
  } catch (index) {
    await Git.Checkout.tree(repository, ourCommit, {
      checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      paths: "README.md",
    })

    const index2 = await repository.refreshIndex()

    await index2.addByPath("README.md")

    await index2.write()

    const treeOid = await index2.writeTree()

    await repository.createCommit("refs/heads/master", signature, signature, "Test", treeOid, [ourCommit, theirCommit])
  }
}

GitTest()
