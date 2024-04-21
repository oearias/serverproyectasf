const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Submodulo = sequelize.define('Submodulo', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    url:{
        type: Sequelize.STRING
    },
    icon:{
        type: Sequelize.STRING
    },
    modulo_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'Modulo',
            key: 'id'
        }
    },
    orden:{
        type: Sequelize.INTEGER
    },
    estatus:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'submodulos',
    schema: 'dbo',
    timestamps: false
});

module.exports = Submodulo;
