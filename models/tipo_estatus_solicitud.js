const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoEstatusSolicitud = sequelize.define('TipoEstatusSolicitud', {
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
    tableName: 'tipo_estatus_solicitud',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoEstatusSolicitud;
