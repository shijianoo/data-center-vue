import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { relative, resolve, sep } from "node:path"

const root = process.cwd()
const lockPath = resolve(root, "tools/tenant-migration/business-content-lock.json")
const lock = JSON.parse(readFileSync(lockPath, "utf8"))
const expected = new Map(Object.entries(lock.files))
const actual = new Set()
let failed = false

for (const directory of lock.roots) {
  const absoluteDirectory = resolve(root, directory)
  if (!existsSync(absoluteDirectory)) {
    console.error(`[business-lock] missing directory: ${directory}`)
    failed = true
    continue
  }
  walk(absoluteDirectory)
}

for (const [file, expectedHash] of expected) {
  if (!existsSync(resolve(root, file))) {
    console.error(`[business-lock] missing file: ${file}`)
    failed = true
    continue
  }
  const actualHash = hash(file)
  if (actualHash !== expectedHash) {
    console.error(`[business-lock] content changed: ${file}`)
    failed = true
  }
}

for (const file of actual) {
  if (!expected.has(file)) {
    console.error(`[business-lock] file is not recorded: ${file}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`[business-lock] verified ${expected.size} frozen business files`)

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    if (entry.isFile() && entry.name !== "route.ts") {
      const file = relative(root, fullPath).split(sep).join("/")
      actual.add(file)
    }
  }
}

function hash(file) {
  return createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex")
}
