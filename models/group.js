const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Group = sequelize.define('Group', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    descripcion: {
        type: Sequelize.STRING,
    },
}, {
    tableName: 'groups',
    schema: 'dbo',
    timestamps: false
});


module.exports = Group;
