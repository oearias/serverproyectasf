const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoEmpleo = sequelize.define('TipoEmpleo', {
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
    tableName: 'tipo_empleo',
    schema: 'dbo',
    timestamps: false
});

module.exports = TipoEmpleo;
