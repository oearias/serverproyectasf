const {Pool} = require('pg');

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
}

const pool = new Pool(config);

module.exports = pool;