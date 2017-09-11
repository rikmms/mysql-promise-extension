const mysql = require('mysql')
const extendedFunctions = require('./connection-wrapper').extendedFunctions
const utils = require('./shared-utils')

const getConnectionP = function() {
  return new Promise((resolve, reject) => this.getConnection((err, connection) => 
    err? reject(err) : resolve(Object.assign(connection, extendedFunctions))
  ))
}

const queryP = function(query) {
  return new Promise((resolve, reject) => this.query(query, (err, results) => err? reject(err) : resolve(results)))
}

const execute = (async function(queries) {
  return new Promise(async (resolve, reject) => {
    const connection = await this.getConnectionP()
    try {
      const results = await Promise.all(utils.promisifyQueries(connection, queries))
      resolve(!Array.isArray(queries) ? results[0] : results)
    }
    finally {
      connection.release()
    }
  })
})

const executeTransaction = (async function(queries) {
  return new Promise(async (resolve, reject) => {
    const connection = await this.getConnectionP()
    try {
      await connection.beginTransactionP()
      const result = await utils.promisifyWaterfallQueries(connection, queries)
      await connection.commitTransactionP()
      resolve(result)
    }
    catch (error) {
      await connection.rollbackP()
      reject(error)
    }
    finally {
      connection.release
    }
  })
})

module.exports = options => {

  const pool = mysql.createPool(options)

  const extendedFunctions = {
    getConnectionP,
    queryP,
    execute,
    executeTransaction
  }

  return Object.assign(pool, extendedFunctions)
}