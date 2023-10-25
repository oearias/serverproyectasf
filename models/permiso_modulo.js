const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Modulo = require('./modulos');

const PermisoModulo = sequelize.define('PermisoModulo', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    modulo_id:{
        type: Sequelize.INTEGER,
        references: {
            model: 'Modulo',
            key: 'id'
        }
    },
    user_group_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'UserGroup',
            key: 'id'
        }
    }
}, {
    tableName: 'permisos_modulos',
    schema: 'dbo',
    timestamps: false
});

PermisoModulo.belongsTo(Modulo, { as: 'modulo', foreignKey: 'modulo_id' });
//PermisoModulo.belongsTo(UserGroup, { as: 'userGroup', foreignKey: 'user_group_id' });

module.exports = PermisoModulo;
