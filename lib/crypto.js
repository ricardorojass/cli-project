'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')

const saltRounds = 5
async function createHash (pass) {
  return await bcrypt.hash(pass, saltRounds)
}

module.exports = {
  createHash
}