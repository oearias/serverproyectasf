const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Tarifa = sequelize.define('Tarifa', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    monto: {
        type: Sequelize.FLOAT,
    },
    monto_semanal: {
        type: Sequelize.FLOAT,
    },
    num_semanas: {
        type: Sequelize.INTEGER,
    },
    cociente:{
        type: Sequelize.FLOAT
    },
    nombre:{
        type: Sequelize.STRING
    },
    estatus:{
        type: Sequelize.STRING
    },
    bonificaciones: {
        type: Sequelize.BOOLEAN
    }
}, {
    tableName: 'tarifas',
    schema: 'dbo',
    timestamps: false
});

module.exports = Tarifa;
