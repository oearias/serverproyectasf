const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Submodulo = require('./submodulo');


const PermisoSubmodulo = sequelize.define('PermisoSubmodulo', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    submodulo_id:{
        type: Sequelize.INTEGER,
        references: {
            model: 'Submodulo',
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
    tableName: 'permisos_submodulos',
    schema: 'dbo',
    timestamps: false
});

PermisoSubmodulo.belongsTo(Submodulo, { as: 'submodulo', foreignKey: 'submodulo_id' });

module.exports = PermisoSubmodulo;
