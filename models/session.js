const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Session = sequelize.define('Session', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    usuario_id: {
        type: Sequelize.STRING,
    },
    session_in: {
        type: Sequelize.DATE,
    },
    session_out: {
        type: Sequelize.DATE,
    },
    session_last_check: {
        type: Sequelize.DATE,
    },
    session_status: {
        type: Sequelize.STRING,
    },
}, {
    tableName: 'sesiones',
    schema: 'dbo',
    timestamps: false
});

module.exports = Session;
