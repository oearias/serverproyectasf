const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const UserGroup = require('./user_group');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: Sequelize.STRING
    },
    apellido_paterno:{
        type: Sequelize.STRING
    },
    apellido_materno:{
        type: Sequelize.STRING
    },
    email:{
        type: Sequelize.STRING
    },
    password:{
        type: Sequelize.STRING
    },
    reset_token:{
        type: Sequelize.STRING
    },
    created_at:{
        type: Sequelize.DATE
    },
    usuario:{
        type: Sequelize.STRING
    },
}, {
    tableName: 'usuarios',
    schema: 'dbo',
    timestamps: false
});

Usuario.prototype.getNombreCompleto = function () {
    let nombreCompleto = this.nombre || ''; // Inicializa con el nombre
    if (this.apellido_paterno) {
        nombreCompleto += ' ' + this.apellido_paterno;
    }
    if (this.apellido_materno) {
        nombreCompleto += ' ' + this.apellido_materno;
    }
    return nombreCompleto;
}


Usuario.belongsTo(UserGroup, {foreignKey: 'user_group_id', as: 'userGroup'})


module.exports = Usuario;
