const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Tarifa = sequelize.define('Tarifa', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    num_semanas: {
        type: Sequelize.INTEGER,
    },
    cociente:{
        type: Sequelize.FLOAT
    },
    nombre:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'tarifas',
    schema: 'dbo',
    timestamps: false
});

module.exports = Tarifa;
