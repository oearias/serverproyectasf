const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoAsentamiento = sequelize.define('TipoAsentamiento', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: Sequelize.STRING
    },
    abreviatura:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'tipo_asentamiento',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoAsentamiento;
