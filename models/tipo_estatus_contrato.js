const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoEstatusContrato = sequelize.define('TipoEstatusContrato', {
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
    tableName: 'tipo_estatus_contrato',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoEstatusContrato;
