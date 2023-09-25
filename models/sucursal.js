const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Sucursal = sequelize.define('Sucursal', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    clave:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'sucursales',
    schema: 'dbo',
    timestamps: false
});

module.exports = Sucursal;
