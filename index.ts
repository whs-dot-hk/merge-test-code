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

  const ourCommit = await repository.getBranchCommit("master")
  const theirCommit = await repository.getBranchCommit("refs/remotes/origin/add-exclamation-mark")

  const index = await Git.Merge.commits(repository, ourCommit, theirCommit)

  if (index.hasConflicts()) {
    await Git.Checkout.tree(repository, ourCommit, {
      checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      paths: "README.md",
    })
  }

  const index2 = await repository.refreshIndex()

  await index2.addByPath("README.md")

  await index2.write()

  const treeOid = await index2.writeTree()

  const author = Git.Signature.now("whs", "hswongac@gmail.com")
  const committor = Git.Signature.now("whs", "hswongac@gmail.com")

  await repository.createCommit("refs/heads/master", author, committor, "Test", treeOid, [ourCommit, theirCommit])
}

GitTest()
