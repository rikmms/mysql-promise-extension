exports.promisifyQueries = (connection, queries) => 
  (!Array.isArray(queries) ?
    [connection.queryP(queries)] :
    queries.map(query => connection.queryP(query))
  )

exports.promisifyWaterfallQueries = (connection, queries) => 
  queries.reduce(async (prevPromise, query) => connection.queryP(query(await prevPromise)), Promise.resolve())