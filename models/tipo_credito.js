const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoCredito = sequelize.define('TipoCredito', {
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
    tableName: 'tipo_credito',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoCredito;
