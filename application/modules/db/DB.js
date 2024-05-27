const { Pool } = require('pg');

const { DB_USERNAME, DB_DATABASE, DB_PASSWORD, DB_PORT, DB_HOST } = process.env;

const pool = new Pool({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_DATABASE,
    password: DB_PASSWORD,
    port: DB_PORT,
});

module.exports = pool;