const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Parentesco = sequelize.define('Parentesco', {
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
    tableName: 'tipo_parentesco',
    schema: 'dbo',
    timestamps: false
});

module.exports = Parentesco;
