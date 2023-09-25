const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Credito = require('./credito');

const BalanceSemanal = sequelize.define('BalanceSemanal', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Credito',
            key: 'id'
        }
    },
    fecha_inicio:{
        type: Sequelize.DATE
    },
    fecha_fin:{
        type: Sequelize.DATE
    },
    num_semana:{
        type: Sequelize.INTEGER
    },
    fecha_inicio_recargo:{
        type: Sequelize.DATE
    },
    fecha_fin_recargo:{
        type: Sequelize.DATE
    },
    fecha_inicio_valida:{
        type: Sequelize.DATE
    },
    fecha_fin_valida:{
        type: Sequelize.DATE
    },
    adeudo_semanal:{
        type: Sequelize.FLOAT
    },
    recargo_semanal:{
        type: Sequelize.FLOAT
    },
    transcurrida:{
        type: Sequelize.INTEGER
    },
    transcurriendo:{
        type: Sequelize.INTEGER
    },
    monto_pago:{
        type: Sequelize.FLOAT
    },
    weekyear:{
        type: Sequelize.INTEGER
    },
}, {
    tableName: 'balance_semanal',
    schema: 'dbo',
    timestamps: false
});


module.exports = BalanceSemanal;
