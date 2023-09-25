const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Semana = sequelize.define('Semana', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha_inicio: {
        type: Sequelize.DATE,
    },
    fecha_fin: {
        type: Sequelize.DATE,
    },
    weekyear: {
        type: Sequelize.INTEGER,
    },
    year:{
        type: Sequelize.INTEGER
    },
    estatus:{
        type: Sequelize.BOOLEAN
    },
    serie:{
        type: Sequelize.STRING
    }
}, {
    tableName: 'semanas',
    schema: 'dbo',
    timestamps: false
});

module.exports = Semana;
