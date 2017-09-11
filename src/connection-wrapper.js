const mysql = require('mysql')
const utils = require('./shared-utils')

const connectP = function() {
  return new Promise((resolve, reject) => this.connect(err => err? reject(err) : resolve()))
}

const endP = function() {
  return new Promise((resolve, reject) => this.end(err => err? reject(err) : resolve()))
}

const queryP = function(query) {
  return new Promise((resolve, reject) => this.query(query, (err, results) => err? reject(err) : resolve(results)))
}

const beginTransactionP = function() {
  return new Promise((resolve, reject) => this.beginTransaction(err => err? reject(err) : resolve()))
}

const commitTransactionP = function() {
  return new Promise((resolve, reject) => this.commit(err => err? reject(err) : resolve()))
}

const rollbackP = function() {
  return new Promise((resolve, reject) => this.rollback(resolve()))
}

const execute = function(queries) {
  return new Promise(async (resolve, reject) => {
    try {
      await this.connectP()
      const results = await Promise.all(utils.promisifyQueries(this, queries))
      resolve(!Array.isArray(queries) ? results[0] : results)
    }
    finally {
      await this.endP()
    }
  })
}

const executeTransaction = function(queries) {
  return new Promise(async (resolve, reject) => {
    try {
      await this.connectP()
      await this.beginTransactionP()
      const result = await utils.promisifyWaterfallQueries(this, queries)
      await this.commitTransactionP()
      resolve(result)
    }
    catch (error) {
      await this.rollbackP()
      reject(error)
    }
    finally {
      await this.endP()
    }
  })
}

const extendedFunctions = {
  connectP,
  endP,
  queryP,
  beginTransactionP,
  commitTransactionP,
  rollbackP,
  execute,
  executeTransaction
}

exports.extendedFunctions = extendedFunctions

exports.createConnection = options => {
  const connection = mysql.createConnection(options)
  return Object.assign(connection, extendedFunctions)
}