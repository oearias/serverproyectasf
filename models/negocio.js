const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const SolicitudCredito = require('./solicitud_credito');
const Colonia = require('./colonia');

const Negocio = sequelize.define('Negocio', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    calle: {
        type: Sequelize.STRING,
    },
    num_ext: {
        type: Sequelize.STRING,
    },
    telefono: {
        type: Sequelize.STRING,
    },
    giro: {
        type: Sequelize.STRING,
    },
    hora_pago: {
        type: Sequelize.TIME,
    },
    colonia_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Colonia',
            key: 'id'
        }
    },
    solicitud_credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'SolicitudCredito',
            key: 'id'
        }
    }
}, {
    tableName: 'negocios',
    schema: 'dbo',
    timestamps: false
});

//Negocio.belongsTo(SolicitudCredito, { as: 'solicitudCredito', foreignKey: 'solicitud_credito_id' });
Negocio.belongsTo(Colonia, { as: 'colonia', foreignKey: 'colonia_id' });

module.exports = Negocio;
