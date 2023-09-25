const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoCliente = sequelize.define('TipoCliente', {
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
    tableName: 'tipo_cliente',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoCliente;
