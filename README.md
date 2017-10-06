# MySQL Promise Extension

This module decorates the objects: [connection](https://www.npmjs.com/package/mysql#establishing-connections) and [pool](https://www.npmjs.com/package/mysql#pooling-connections), from the [mysql](https://www.npmjs.com/package/mysql) module, with more functionality and support to [ES6 promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). It was written with the goal to define queries and transactions with less effort.

----------

### Installation
It's available through the NPM package:

    npm install --save mysql (peer dependency)
    npm install --save mysql-promise-extension

----------

### Usage
This module exports two factory functions. One for connections: `createConnection(options)`, and another for the pool: `pool(options)`. **The options are the same as the [options](https://www.npmjs.com/package/mysql#connection-options) from the [mysql](https://www.npmjs.com/package/mysql) module.**

### **connection**
The connection object returned by the factory function `createConnection(options)` is the same as the [connection](https://www.npmjs.com/package/mysql#establishing-connections) object from the [mysql](https://www.npmjs.com/package/mysql) module, but with the extended functionality provided by this module. So, **you have access to all original properties and functions from the mysql module in the case you need it**. 

The principal extended functions provided are:

 - `execute(query)`
 - `executeTransaction(queryFunctions)` 

These functions: `execute` and `executeTransaction`, provide a simple way to perform queries in the database with less verbose code like: establish and terminate connections or handle the transactions commit/rollback.

**The query object is the [same](https://www.npmjs.com/package/mysql#performing-queries) as the used in the [mysql](https://www.npmjs.com/package/mysql) module.**

Also, provides the promisified version of the core functions:

 - `connectP()`: Wrap function for `connection.connect()`
 - `endP()`: Wrap function for `connection.end()` 
 - `queryP(query)`: Wrap function for `connection.query(query)`
 - `beginTransactionP()`: Wrap function for `connection.beginTransaction()`
 - `commitTransactionP()`: Wrap function for `connection.commit()`
 - `rollbackP()`: Wrap function for `connection.rollback()`

#### Examples with async/await

**First of all, lets see how the `execute` and `executeTransaction` are used:**

```js
const createConnection = require('mysql-promise-extension').createConnection
const options = { ... }

const getHobbiesAndUsers = (async () => {
	const queryHobbies = 'select name from HOBBY'
	const queryUsers = 'select name from USER'
	const [hobbies, users] = await createConnection(options).execute([queryHobbies, queryUsers])
	return { hobbies, users }
})

const getHobbiesFromUser = (async () => {
	const queryHobbies = {
		sql: 'select hobby_name as name from USER_HOBBY where user_id=?',
		values: [1]
	}
	const hobbies = await createConnection(options).execute(queryHobbies)
	return hobbies
})

const createUserAndHobby = (async () => {
	const queryCreateUser = () => ({
		sql: 'insert into USER (name) values(?);',
		values: ['bob']
	})

	const queryCreateAssociationWithHobby = previousQueryResult => ({
		sql: 'insert into USER_HOBBY (user_id, hobby_name) values(?,?);',
		values: [previousQueryResult.insertId, 'soccer']
	})

	const result = await createConnection(options).executeTransaction([queryCreateUser, queryCreateAssociationWithHobby])
	return result.affectedRows
})
```

With the `execute` function, we only need to define the queries to pass as a argument and can be more than one. 

The `executeTransaction` function is slightly different. As we can see, it receives an array of functions. Those functions can receive one argument, which is the result of the previous query. It's useful for cases where we need the result of the previous query. The functions return a query object identical to the object used in the `execute` function. 
The `executeTransaction` uses the waterfall implementation approach to preserve the sequential order.
**If any error is thrown during the transaction, then rollback will be done automatically.**


**Now, lets see with the promisified functions:**

```js
const createConnection = require('mysql-promise-extension').createConnection
const options = { ... }

const getHobbiesAndUsers = (async () => {
	const connection = createConnection(options)
	try {
		await connection.connectP()
		const [hobbies, users] = await Promise.all([connection.queryP('select name from HOBBY'), connection.queryP('select name from USER')])
		return { hobbies, users }
	}
	finally {
		await connection.endP()
	}

	return null
})
		
const getHobbiesFromUser = (async () => {
	const connection = createConnection(options)
	try {
		await connection.connectP()
		const hobbies = await connection.queryP('select hobby_name as name from USER_HOBBY where user_id=1')
		return hobbies
	}
	finally {
		await connection.endP()
	}

	return null
})

const createUserAndHobby = (async () => {
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

		return createHoby.affectedRows
	}
	catch(err) {
		await connection.rollbackP()
	}
	finally {
		await connection.endP()
	}

	return 0
})
```

### **pool**
If you want to use a pool of connections, you can get it through the factory function `pool(options)`.
The factory function returns an object identical to the MySql module's [pool](https://www.npmjs.com/package/mysql#pooling-connections) object, but, like the connection, is extended with more functionality.

The extended functions provided are:

 - `getConnectionP()`: Wrap function for `pool.getConnection()`
 - `queryP(query)`: Wrap function for `pool.query(query)`
 - `execute(query)`
 - `executeTransaction(queryFunctions)` 

Where the functions with suffix "P" are the promisified functions, and the last two functions: `execute` and `executeTransaction`, provide the same functionality as the functions, with same names, from the connection object.

#### Examples

**With the `execute` and `executeTransaction` functions (the same use as in the connection):**

```js
const options = { ... }
const pool = require('mysql-promise-extension').pool(options)

const getHobbiesAndUsers = (async () => {
	const queryHobbies = 'select name from HOBBY'
	const queryUsers = 'select name from USER'
	const [hobbies, users] = await pool.execute([queryHobbies, queryUsers])
	return { hobbies, users }
})

const getHobbiesFromUser = (async () => {
	const queryHobbies = {
		sql: 'select hobby_name as name from USER_HOBBY where user_id=?',
		values: [1]
	}

	const hobbies = await pool.execute(queryHobbies)
	return hobbies
})

const createUserAndHobby = (async () => {
	const queryCreateUser = () => ({
		sql: 'insert into USER (name) values(?);',
		values: ['bob']
	})

	const queryCreateAssociationWithHobby = previousQueryResult => ({
		sql: 'insert into USER_HOBBY (user_id, hobby_name) values(?,?);',
		values: [previousQueryResult.insertId, 'soccer']
	})

	const result = await pool.executeTransaction([queryCreateUser, queryCreateAssociationWithHobby])
	return result.affectedRows
})
```
**With the promisified functions:**

```js
const options = { ... }
const pool = require('mysql-promise-extension').pool(options)

const getHobbiesAndUsers = (async () => {
	const [hobbies, users] = await pool.queryP('select name from HOBBY; select name from USER;')
	return { hobbies, users }
})

const getHobbiesFromUser = (async () => {
	// Use the connection directly from the pool
	const connection = await pool.getConnectionP()
	try {
  	const hobbies = await connection.queryP('select hobby_name as name from USER_HOBBY where user_id=1')
		return hobbies
	}
	finally {
		// Don't forget to release it
		connection.release()
	}

	return null
})

const createUserAndHobby = (async () => {
	const connection = await pool.getConnectionP()
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

		return createHobby.affectedRows
	}
	catch(err) {
		await connection.rollbackP()
	}
	finally {
		connection.release()
	}

	return 0
})
```

----------
#### Bugs/Requests
[GitHub issues](https://github.com/rikmms/mysql-promise-extension/issues)

#### Todo List:
 - Create the proper documentation.
 - Able to extend the [PoolCluster](https://www.npmjs.com/package/mysql#poolcluster) functionality.
