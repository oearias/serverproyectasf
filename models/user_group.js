const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const UserGroup = sequelize.define('UserGroup', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: Sequelize.STRING
    },
    descripcion:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'user_group',
    schema: 'dbo',
    timestamps: false
});

module.exports = UserGroup;


