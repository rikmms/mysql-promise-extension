'use strict'
const assert = require('chai').assert
const createConnection = require('./connection-wrapper').createConnection
const sharedSpec = require('./shared.spec')

const options = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DB,
  multipleStatements: true
}

describe('connection wrapper unit tests', () => {

  before(async () => {
    await createConnection(options).queryP(sharedSpec.dropTablesStatement)
    await createConnection(options).queryP(sharedSpec.createTablesStatement)
    await createConnection(options).queryP(sharedSpec.insertStatements)
  })

  it('should return the hobbies from the user "1"', (async () => {

    const queryHobbies = {
      sql: 'select hobby_name as name from USER_HOBBY where user_id=?',
      values: [1]
    }

    const hobbies = await createConnection(options).execute(queryHobbies)
    assert.equal(1, hobbies.length)
    assert.equal('soccer', hobbies[0].name)
  }))

  it('should return the hobbies from the user "1", with the P functions from connection', (async () => {
    const connection = createConnection(options)
    try {
      await connection.connectP()
      const hobbies = await connection.queryP('select hobby_name as name from USER_HOBBY where user_id=1')  
      assert.equal(1, hobbies.length)
      assert.equal('soccer', hobbies[0].name)
    }
    finally {
      await connection.endP()
    }
  }))

  it('should return all the hobbies and users', (async () => {
    const queryHobbies = 'select name from HOBBY'
    const queryUsers = 'select name from USER'

    const [hobbies, users] = await createConnection(options).execute([queryHobbies, queryUsers])
    assert.equal('soccer', hobbies[0].name)
    assert.equal('rikmms', users[0].name)
  }))

  it('should return all the hobbies and users, with the P functions from connection', (async () => {
    const connection = createConnection(options)
    try {
      await connection.connectP()
      const [hobbies, users] = await Promise.all([connection.queryP('select name from HOBBY'), connection.queryP('select name from USER')])
      assert.equal('soccer', hobbies[0].name)
      assert.equal('rikmms', users[0].name)
    }
    finally {
      await connection.endP()
    }
  }))

  
  it('should create one user and associate it with the hobby "soccer", inside a transaction', (async () => {
  
    const queryCreateUser = () => ({
      sql: 'insert into USER (name) values(?);',
      values: ['di8g8']
    })

    const queryCreateAssociationWithHobby = previousQueryResult => ({
      sql: 'insert into USER_HOBBY (user_id, hobby_name) values(?,?);',
      values: [previousQueryResult.insertId, 'soccer']
    })

    const result = await createConnection(options).executeTransaction([queryCreateUser, queryCreateAssociationWithHobby])
    assert.equal(1, result.affectedRows)
  }))

  it('should create one user and associate it with the hobby "soccer", inside a transaction, with the P functions from connection', (async () => {
    const connection = createConnection(options)
    await connection.connectP()
    try {
      await connection.beginTransactionP()
      
      const createUser = await connection.queryP({
        sql: 'insert into USER (name) values(?);',
        values: ['bob']
      })

      const createHobby = await connection.queryP({
        sql: 'insert into USER_HOBBY (user_id, hobby_name) values(?,?);',
        values: [createUser.insertId, 'soccer']
      })
  
      await connection.commitTransactionP()

      assert.equal(1, createHobby.affectedRows)
    }
    catch(err) {
      await connection.rollbackP()
    }
    finally {
      await connection.endP()
    }

  }))

  it('should create one user and one hobby, inside a transaction', (async () => {
    
    const queryCreateUser = () => ({
      sql: 'insert into USER (name) values(?);',
      values: ['alice']
    })

    const queryCreateHobby = () => ({
      sql: 'insert into HOBBY (name) values(?);',
      values: ['code']
    })

    const result = await createConnection(options).executeTransaction([queryCreateUser, queryCreateHobby])
    assert.equal(1, result.affectedRows)
  }))
})