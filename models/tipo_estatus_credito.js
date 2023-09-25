const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoEstatusCredito = sequelize.define('TipoEstatusCredito', {
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
    tableName: 'tipo_estatus_credito',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoEstatusCredito;
