#!/usr/bin/env node

'use-strict'

require('dotenv').config()

const minimist = require('minimist')
const { createDb } = require('./lib/')
const argv = minimist(process.argv.slice(2))

async function main () {
  const db = await createDb(process.env.DB_TYPE)
  const command = argv._.shift()

  switch (command) {
    case 'users:create':
      try {
        const { user, pass } = argv
        await db.createUser(user, pass)
        console.log(`${user} created`)
      } catch(err) {
        throw new Error('Cannot create user')
      }
      break
    case 'users:list':
      try {
        const results = await db.listUsers()
        results.users.forEach(user => {
          console.log(`- ${user.user}`)
        })
        console.log(`\tTotal ${results.count}`)
      } catch (err) {
        throw new Error('Cannot list user')
      }
      break
    case 'secrets:create':
      try {
        const { user, name, value } = argv
        await db.createSecret(user, name, value)
        console.log(`secret: ${name} created`)
      } catch (err) {
        throw new Error('Cannot create secrets')
      }
      break
    case 'secrets:list':
      try {
        const { user } = argv
        const secrets = await db.listSecrets(user)
        secrets.forEach(s => {
          console.log(`- ${s.name}`);
        })
      } catch (err) {
        throw new Error('Cannot list secrets')
      }
      break
    case 'secrets:get':
      try {
        const { user, name } = argv
        const secret = await db.getSecret(user, name)
        if (!secret) return console.log(`secret ${name} not found`)
        console.log(`- ${secret.name} = ${secret.value}`)
      } catch (err) {
        throw new Error('Cannot get secret')
      }
      break
    case 'secrets:update':
      try {
        const { user, name, value } = argv
        const secret = db.updateSecret(user, name, value)
        if (!secret) return console.log(`secret ${name} not found`)
        console.log(`secret ${name} updated`)
      } catch (err) {
        throw new Error('Cannot update secret')
      }
      break
    case 'secrets:delete':
      try {
        const { user, name } = argv
        const secret = db.deleteSecret(user, name)
        if (!secret) return console.log(`secret ${name} not found`)
        console.log(`secret ${name} deleted`)
      } catch (err) {
        throw new Error('Cannot delete secret')
      }
      break
    default:
      console.error(`Command not found ${command}`)
  }
}

main().catch(err => console.log(err))
