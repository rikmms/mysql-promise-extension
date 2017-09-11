## mysql-easy-pool

This module exports an object to handle with the mysql connection's pool more easily. We can use the getConnection() function to get one connection for execute our queries, or we can use the getTransactionConnection() function to get one connection inside a transaction that performs the rollback action if any error occurred.

The purpose of this module is to act like a helper for the great [mysql](https://www.npmjs.com/package/mysql) module.

#### Installation:
- ```npm install mysql-easy-pool```

#### Example:
<pre>
  <code>
    const MySqlEasyPool = require('mysql-easy-pool')
    const mysqlPool = new MySqlEasyPool({
    	host: process.env.HOST,
    	user: process.env.USER,
    	password: process.env.PASS,
    	database: process.env.DB
    })
  
    mysqlPool.getConnection((connection, done) => {
      // create the queries
    	connection.query(SQL STATEMENT, [...], (err, res) => {
    	  done(err, res)
    	})
    }, callback)
    
    mysqlPool.getTransactionConnection((connection, done) => {
      // create the queries
  		async.waterfall([
  			(cb) => {
  				connection.query(SQL STATEMENT ONE, [...], (err, res) => cb(err, res))
  			},
  			(res, cb) => {
  				connection.query(SQL STATEMENT TWO, [...], (err, res) => cb(err, res))
  			}
  		],
  		(err, res) => {
  			done(err, res)
  		})
  	}, callback)
  	
    > Where the callback function receives the error or the result, like: function(err, result) = { ... }

    > You can use the getter function 'pool', like "mysqlPool.pool", for set extra options to the pool.
  </code>
</pre>

#### Future dev:
 - Improve the documentation.
 - Able to support the [PoolCluster](https://www.npmjs.com/package/mysql#poolcluster) functionality.
