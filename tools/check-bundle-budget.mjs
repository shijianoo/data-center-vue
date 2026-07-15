import { readdir, readFile, stat } from "node:fs/promises"
import { extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const distPath = fileURLToPath(new URL("../dist/", import.meta.url))
const budgets = {
  ".js": 750 * 1024,
  ".css": 300 * 1024
}
const initialBudgets = {
  ".js": 350 * 1024,
  ".css": 100 * 1024
}
const knownVendorBudgets = {
  "maplibre-gl-": 1100 * 1024
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(path) : [path]
  }))
  return nested.flat()
}

async function main() {
  const assets = (await collectFiles(distPath)).filter(path => budgets[extname(path)])
  const measured = await Promise.all(assets.map(async path => ({
    path,
    bytes: (await stat(path)).size,
    budget: budgets[extname(path)]
  })))
  const html = await readFile(join(distPath, "index.html"), "utf8")
  const initialPaths = new Set(
    [...html.matchAll(/(?:src|href)=["']\/?(assets\/[^"']+\.(?:js|css))["']/g)]
      .map(match => match[1].replaceAll("/", "\\"))
  )
  const initial = measured.filter(item => initialPaths.has(relative(distPath, item.path)))
  const initialTotals = Object.fromEntries(Object.keys(initialBudgets).map(extension => [
    extension,
    initial.filter(item => extname(item.path) === extension).reduce((total, item) => total + item.bytes, 0)
  ]))
  const exceeded = measured.filter((item) => {
    if (initial.includes(item)) return false
    const filename = relative(distPath, item.path).split(/[\\/]/).at(-1) ?? ""
    const vendorBudget = Object.entries(knownVendorBudgets).find(([prefix]) => filename.startsWith(prefix))?.[1]
    return item.bytes > (vendorBudget ?? item.budget)
  })
  const initialExceeded = Object.entries(initialBudgets)
    .filter(([extension, budget]) => initialTotals[extension] > budget)

  console.log("[bundle-budget] largest assets:")
  measured.toSorted((left, right) => right.bytes - left.bytes).slice(0, 8).forEach((item) => {
    console.log(`  ${relative(distPath, item.path)} ${(item.bytes / 1024).toFixed(1)} KiB`)
  })
  console.log(
    `[bundle-budget] initial JS ${(initialTotals[".js"] / 1024).toFixed(1)} KiB, CSS ${(initialTotals[".css"] / 1024).toFixed(1)} KiB`
  )

  if (exceeded.length || initialExceeded.length) {
    exceeded.forEach((item) => {
      console.error(`[bundle-budget] ${relative(distPath, item.path)} exceeds ${(item.budget / 1024).toFixed(0)} KiB`)
    })
    initialExceeded.forEach(([extension, budget]) => {
      console.error(`[bundle-budget] initial ${extension} exceeds ${(budget / 1024).toFixed(0)} KiB`)
    })
    process.exitCode = 1
  }
}

void main()
