'use strict'

const path = require('path')
const { Database } = require('sqlite3').verbose()

const db = new Database(path.join(__dirname, '..', 'secrets.db'))
const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      user TEXT PRIMARY KEY,
      pass TEXT NOT NULL
    );
  `,
  tableSecrets: `
    CREATE TABLE IF NOT EXISTS secrets (
      user TEXT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user, name),
      FOREIGN KEY (user)
        REFERENCES users (user)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
    )
  `
}

async function createDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(queries.tableUsers)
      db.run(queries.tableSecrets, err => {
        if (err) return reject(err)

        resolve({
            client: db
        })
      })

    })

  })
}

module.exports = {
    createDb
}