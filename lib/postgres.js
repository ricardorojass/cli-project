'use strict'

const { Client } = require('pg')
const { createHash } = require('./crypto')

const dbUrl = process.env.DB_URL

const client = new Client({
  connectionString: dbUrl
})

const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      username text NOT NULL,
      password text NOT NULL
    );
  `,
  tableSecrets: `
    CREATE TABLE IF NOT EXISTS secrets (
      id        serial NOT NULL,
      user_id   int    NOT NULL REFERENCES users (id),
      username  text   NOT NULL,
      name      text   NOT NULL,
      value     text   NOT NULL
    );
  `
}

async function createDb () {
  await client.connect()

  await client.query(queries.tableUsers)
  await client.query(queries.tableSecrets)

  return {
    client,
    createUser,
    listUsers,
    createSecret,
    listSecrets,
    getSecret,
    updateSecret,
    deleteSecret,
    createFakeUsers,
    createFakeSecrets
  }
}

async function createUser (username, password) {
  const secureHash = await createHash(password)
  await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, secureHash])
  await client.end()
}

async function listUsers () {
  const res = await client.query('SELECT username AS user FROM users')
  client.end()
  return {
    count: res.rowCount,
    users: res.rows
  }
}

async function createSecret (username, name, value) {
  await client.query('INSERT INTO secrets (username, name, value) VALUES ($1, $2, $3)', [username, name, value])
  await client.end()
}

async function listSecrets (username) {
  const res = await client.query('SELECT name FROM secrets WHERE username = $1', [username])
  await client.end()
  return res.rows
}

async function getSecret (username, name) {
  const res = await client.query(
    `
    SELECT name, value FROM secrets
    WHERE username = $1 AND name = $2
    `, [
      username,
      name
    ])
    await client.end()
    if (res.rows.length > 0) {
      return res.rows[0]
    } else {
      return null
    }
}

async function updateSecret (username, name, value) {
  await client.query(
    `
    UPDATE secrets
    SET value = $3
    WHERE username = $1 AND name = $2
    `, [
      username,
      name,
      value
    ]
  )
  await client.end()
}

async function deleteSecret (username, name) {
  await client.query(
    `
    DELETE FROM secrets
    WHERE username = $1 AND name = $2
    `, [
    username,
    name
  ])
  await client.end()
}

async function createFakeUsers () {
  for (let user = 0; user <= 1000; user++) {
    const password = 'pass123'
    const username = `ricardo-${user}`
    const secureHash = await createHash(password)

    await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, secureHash])
  }
  await client.end()
}

async function createFakeSecrets () {
  for (let users = 0; users <= 1000; users++) {
    let secrets = 0
    while (secrets <= 1000) {
      const secretsObj = createSecretObj(users)
      await client.query('INSERT INTO secrets (username, name, value) VALUES ($1, $2, $3) RETURNING *', [secretsObj.username, secretsObj.name, secretsObj.value])
      secrets++
    }
  }
  await client.end()
}

function createSecretObj (count) {
  return {
    username: `ricardo-${count}`,
    name: `ricardo secret-${count}`,
    value: `ricardo value-${count}`
  }
}

module.exports = {
  createDb
}