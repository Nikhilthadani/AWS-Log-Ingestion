const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "nikhil1234"),
  {
    maxConnectionPoolSize: 100,
    connectionTimeout: 30000,
    disableLosslessIntegers: true
  }
);

// Add connection health check
driver.verifyConnectivity()
  .then(() => console.log('Neo4j connection verified'))
  .catch(err => console.error('Neo4j connection failed:', err));

process.on('exit', () => driver.close());

module.exports = { driver };