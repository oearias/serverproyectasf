const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const SolicitudCredito = require('./solicitud_credito');
const Colonia = require('./colonia');

const Aval = sequelize.define('Aval', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    apellido_paterno: {
        type: Sequelize.STRING,
    },
    apellido_materno: {
        type: Sequelize.STRING,
    },
    fecha_nacimiento: {
        type: Sequelize.DATE,
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
    tableName: 'avales',
    schema: 'dbo',
    timestamps: false
});

//Aval.belongsTo(SolicitudCredito, { as: 'solicitudCredito', foreignKey: 'solicitud_credito_id' });
Aval.belongsTo(Colonia, { as: 'colonia', foreignKey: 'colonia_id' });

module.exports = Aval;
