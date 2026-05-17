#!/usr/bin/env node
/**
 * Platform-aware build script.
 * Detects the current OS and runs the appropriate electron-builder target.
 *
 * Usage:
 *   node scripts/build.js            — current platform only
 *   node scripts/build.js --all      — all platforms (needs native runners or Docker)
 *   node scripts/build.js --mac      — macOS
 *   node scripts/build.js --win      — Windows
 *   node scripts/build.js --linux    — Linux
 */

const { execSync } = require('child_process')
const { platform: osPlatform } = require('os')

const args = process.argv.slice(2)

function run(cmd) {
  console.log(`\n▶  ${cmd}\n`)
  execSync(cmd, { stdio: 'inherit' })
}

function platformFlag() {
  if (args.includes('--all')) return '-mwl'
  if (args.includes('--mac'))   return '--mac'
  if (args.includes('--win'))   return '--win'
  if (args.includes('--linux')) return '--linux'

  const p = osPlatform()
  if (p === 'darwin')  return '--mac'
  if (p === 'win32')   return '--win'
  return '--linux'
}

const flag = platformFlag()
const platformLabel = {
  '--mac': 'macOS',
  '--win': 'Windows',
  '--linux': 'Linux',
  '-mwl': 'macOS + Windows + Linux'
}[flag] || flag

console.log(`\n📦  NoteTaker — building for ${platformLabel}`)

run('npm run build')
run(`npx electron-builder ${flag}`)

console.log('\n✅  Build complete. Output in ./release/\n')
