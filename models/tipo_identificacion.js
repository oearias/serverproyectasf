const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoIdentificacion = sequelize.define('TipoIdentificacion', {
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
    tableName: 'tipo_identificacion',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoIdentificacion;
