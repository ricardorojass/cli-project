#!/usr/bin/env node

'use-strict'

const minimist = require('minimist')
const { createDb } = require('./lib/db')
const argv = minimist(process.argv.slice(2))

console.log(argv);

async function main () {
  const db = await createDb()
  const command = argv._.shift()

  switch (command) {
    case 'users:create':
      break
    case 'users:list':
      break
    case 'secrets:create':
      break
    case 'secrets:list':
      break
    default:
      console.error(`Command not found ${command}`)
  }
}

main().catch(err => console.log(err))
