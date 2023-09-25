const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Sucursal = require('./sucursal');

const Zona = sequelize.define('Zona', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    sucursal_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Sucursal',
            key: 'id'
        }
    }
}, {
    tableName: 'zonas',
    schema: 'dbo',
    timestamps: false
});

Zona.belongsTo(Sucursal, { as: 'sucursal', foreignKey: 'sucursal_id' });

module.exports = Zona;
