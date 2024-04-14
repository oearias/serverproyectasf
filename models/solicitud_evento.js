const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const SolicitudCredito = require('./solicitud_credito');
const Usuario = require('./usuario');

const SolicitudEvento = sequelize.define('SolicitudEvento', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    solicitud_credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'SolicitudCredito',
            key: 'id'
        }
    },
    usuario_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Usuario',
            key: 'id'
        }
    },
    evento: {
        type: Sequelize.STRING,
    },
    observacion: {
        type: Sequelize.STRING,
    },
    fecha: {
        type: Sequelize.DATE,
    },
}, {
    tableName: 'solicitud_eventos',
    schema: 'dbo',
    timestamps: false
});

module.exports = SolicitudEvento;

SolicitudEvento.belongsTo(SolicitudCredito, { as: 'solicitudCredito', foreignKey: 'solicitud_credito_id' });
SolicitudEvento.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id' });
