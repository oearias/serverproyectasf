const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Zona = require('./zona');

const Agencia = sequelize.define('Agencia', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    zona_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Zona',
            key: 'id'
        }
    }
}, {
    tableName: 'agencias',
    schema: 'dbo',
    timestamps: false
});

Agencia.belongsTo(Zona, { as: 'zona', foreignKey: 'zona_id' });

module.exports = Agencia;
