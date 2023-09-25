const Sequelize = require('sequelize');
const sequelize = require('../database/config');
const Credito = require('./credito');

const Pago = sequelize.define('Pago', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha:{
        type: Sequelize.DATE
    },
    monto:{
        type: Sequelize.FLOAT
    },
    credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Credito',
            key: 'id'
        }
    },
    cancelado:{
        type: Sequelize.INTEGER
    },
    observaciones:{
        type: Sequelize.STRING
    },
    hora:{
        type: Sequelize.TIME
    },
    metodo_pago:{
        type: Sequelize.STRING
    },
    weekyear:{
        type: Sequelize.INTEGER
    },
    folio:{
        type: Sequelize.STRING
    },
    fecha_programada_pago:{
        type: Sequelize.DATE
    },
}, {
    tableName: 'pagos',
    schema: 'dbo',
    timestamps: false
});

Pago.belongsTo(Credito, { as: 'credito', foreignKey: 'credito_id' });

module.exports = Pago;
