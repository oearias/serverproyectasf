const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const TipoAsentamiento = require('./tipo_asentamiento');

const Colonia = sequelize.define('Colonia', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: Sequelize.STRING
    },
    cp:{
        type: Sequelize.INTEGER
    },
    tipo_asentamiento_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'TipoAsentamiento',
            key: 'id'
        }
    }
}, {
    tableName: 'colonias',
    schema: 'dbo',
    timestamps: false
});

Colonia.belongsTo(TipoAsentamiento, { as: 'tipoAsentamiento', foreignKey: 'tipo_asentamiento_id' });

module.exports = Colonia;
