const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const SolicitudCredito = require('./solicitud_credito');

const SolicitudServicio = sequelize.define('SolicitudServicio', {
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
    luz: {
        type: Sequelize.BOOLEAN,
    },
    agua_potable: {
        type: Sequelize.BOOLEAN,
    },
    auto_propio: {
        type: Sequelize.BOOLEAN,
    },
    telefono_fijo: {
        type: Sequelize.BOOLEAN,
    },
    telefono_movil: {
        type: Sequelize.BOOLEAN,
    },
    refrigerador: {
        type: Sequelize.BOOLEAN,
    },
    estufa: {
        type: Sequelize.BOOLEAN,
    },
    internet: {
        type: Sequelize.BOOLEAN,
    },
    gas: {
        type: Sequelize.BOOLEAN,
    },
    alumbrado_publico: {
        type: Sequelize.BOOLEAN,
    },
    tv: {
        type: Sequelize.BOOLEAN,
    },
}, {
    tableName: 'solicitud_servicio',
    schema: 'dbo',
    timestamps: false
});

// SolicitudServicio.belongsTo(SolicitudCredito, { as: 'solicitudCredito', foreignKey: 'solicitud_credito_id' });

module.exports = SolicitudServicio;
