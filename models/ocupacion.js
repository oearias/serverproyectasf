const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Ocupacion = sequelize.define('Ocupacion', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'ocupaciones',
    schema: 'dbo',
    timestamps: false
});

module.exports = Ocupacion;
