// //Archivo de configuracion para Sequelize

// const {Sequelize} = require('sequelize');

// const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     dialect: 'postgres',
//     logging: false,
// });

// module.exports = sequelize;

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 10, // Número máximo de conexiones en la pool
        min: 0,  // Número mínimo de conexiones en la pool
        acquire: 60000, // Tiempo máximo en milisegundos para intentar adquirir una conexión antes de lanzar un error
        idle: 10000 // Tiempo máximo en milisegundos que una conexión puede estar inactiva antes de ser liberada
    }
});

module.exports = sequelize;
