'use strict'

const { Client } = require('pg')
const { createHash } = require('./crypto')
const format = require('pg-format')

const dbUrl = process.env.DB_URL

const client = new Client({
  connectionString: dbUrl
})

const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      id        serial  PRIMARY KEY,
      username  text    NOT NULL,
      password  text    NOT NULL
    );
  `,
  tableSecrets: `
    CREATE TABLE IF NOT EXISTS secrets (
      username  text   NOT NULL,
      name      text   NOT NULL,
      value     text   NOT NULL,
      user_id   int    NOT NULL REFERENCES users (id)
    );
  `,
  createSecretIndexes: `
    CREATE UNIQUE INDEX idx_secrets_username_name ON secrets(username, name);
  `,
  viewAllUsers: `
    CREATE OR REPLACE VIEW user_master AS
      SELECT username FROM users;
  `,
  viewListSecrets: `
    CREATE OR REPLACE VIEW list_secrets AS
      SELECT name FROM secrets WHERE username = $1;
  `,
}

// remover el primary key de secrets.
// en vez de pk crear un index por username.

// 1. crear la tabla secrets sin index
// 2. crear los fake secrets
// 3. crear el index una vez termine la creacion.

// SELECT * es mala practica, es mejor especificar los campos que necesito

// 2 tipos de index: unique index, index


async function createDb () {
  await client.connect()

  await client.query(queries.tableUsers)
  await client.query(queries.tableSecrets)
  await client.query(queries.viewAllUsers)

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
  const res = await client.query('SELECT * FROM user_master') // Use a Postgres VIEW
  client.end()
  return {
    count: res.rowCount,
    users: res.rows
  }
}

async function createSecret (username, name, value) {
  const userRes = await client.query('SELECT id FROM users WHERE username = $1', [username])
  const userId = userRes.rows[0].id
  await client.query('INSERT INTO secrets (username, name, value, user_id) VALUES ($1, $2, $3, $4)', [username, name, value, userId])
  await client.end()
}

async function listSecrets (username) {
  const res = await client.query('SELECT name FROM secrets WHERE username = $1', [username])
  await client.end()
  return {
    count: res.rowCount,
    secrets: res.rows
  }
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
  for (let user = 1; user <= 2000; user++) {
    const password = 'pass123'
    const username = `ricardo-${user}`
    const secureHash = await createHash(password)

    await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, secureHash])
  }
  await client.end()
}

async function createFakeSecrets () {
  // const query = {
  //   // give the query a unique name
  //   name: 'create-fake-secrets',
  //   text: `
  //     INSERT INTO secrets (user_id, username, name, value)
  //     VALUES ($1, $2, $3, $4)`,
  //   values: [1,2,3,4],
  // }
  
  const start = Date.now()
  let values = []
  for (let users = 1; users <= 2000; users++) {
    let secrets = 1
    values = []
    while (secrets <= 2000) {
      const guid = generateQuickGuid()
      
      values.push(createSecretObj(users, guid))
      
      
      // query.values = [users, secretsObj.username, secretsObj.name, secretsObj.value]
      
      secrets++
    }
    let query = format('INSERT INTO secrets (username, name, value, user_id) VALUES %L', values);
    await client.query(query)
  }
  
  await client.query(queries.createSecretIndexes)
  await client.end()
  const finishInMmilliseconds = Date.now() - start
  console.log(`Time ${Math.floor(finishInMmilliseconds / 60000)}`)
}


function createSecretObj (index, guid) {
  return [
    `ricardo-${index}`,
    `ricardo secret name-${guid}`,
    `ricardo value-${index}`,
    `${index}`
  ]
}

function generateQuickGuid() {
  return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
}

module.exports = {
  createDb
}