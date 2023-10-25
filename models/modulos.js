const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const PermisoModulo = require('./permiso_modulo');

const Modulo = sequelize.define('Modulo', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    url:{
        type: Sequelize.STRING
    },
    icon:{
        type: Sequelize.STRING
    },
    orden:{
        type: Sequelize.INTEGER
    }
}, {
    tableName: 'modulos',
    schema: 'dbo',
    timestamps: false
});

module.exports = Modulo;
