const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Tarifa = require('../models/tarifa');
const TipoCredito = require('./tipo_credito');
const Cliente = require('./cliente');
const TipoEstatusCredito = require('./tipo_estatus_credito')
const SolicitudCredito = require('./solicitud_credito');
const TipoEstatusContrato = require('./tipo_estatus_contrato');
const BalanceSemanal = require('./balance_semanal');


const Credito = sequelize.define('Credito', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    monto_otorgado: {
        type: Sequelize.FLOAT,
    },
    monto_total:{
        type: Sequelize.FLOAT
    },
    tarifa_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Tarifa',
            key: 'id',
        }
    },
    tipo_credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoCredito',
            key: 'id'
        }
    },
    estatus_credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoEstatusCredito',
            key: 'id'
        }
    },
    num_contrato:{
        type: Sequelize.INTEGER,
    },
    num_contrato_historico:{
        type: Sequelize.STRING,
    },
    fecha_creacion:{
        type: Sequelize.DATE,
    },
    fecha_inicio_prog:{
        type: Sequelize.DATE,
    },
    fecha_fin_prog:{
        type: Sequelize.DATE
    },
    fecha_fin_prog_proyecta:{
        type: Sequelize.DATE
    },
    fecha_entrega_prog:{
        type: Sequelize.DATE
    },
    fecha_inicio_real:{
        type: Sequelize.DATE,
    },
    fecha_fin_real:{
        type: Sequelize.DATE
    },
    fecha_entrega_real:{
        type: Sequelize.DATE
    },
    cliente_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Cliente',
            key: 'id'
        }
    },
    solicitud_credito_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'SolicitudCredito',
            key: 'id'
        }
    },
    locked:{
        type: Sequelize.INTEGER
    },
    renovacion:{
        type: Sequelize.INTEGER
    },
    num_cheque:{
        type: Sequelize.INTEGER
    },
    preaprobado:{
        type: Sequelize.INTEGER
    },
    entregado:{
        type: Sequelize.INTEGER
    },
    no_entregado:{
        type: Sequelize.INTEGER
    },
    motivo:{
        type: Sequelize.STRING
    },
    estatus_contrato_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoEstatusContrato',
            key: 'id'
        }
    },
    hora_entrega:{
        type: Sequelize.TIME
    },
    inversion_positiva:{
        type: Sequelize.BOOLEAN
    },
    num_contrato_historico:{
        type: Sequelize.STRING
    },
    aux_num_penalizaciones:{
        type: Sequelize.INTEGER
    },
}, {
    tableName: 'creditos',
    schema: 'dbo',
    timestamps: false
});

Credito.belongsTo(Tarifa, { as: 'tarifa', foreignKey: 'tarifa_id' });
Credito.belongsTo(TipoCredito, { as: 'tipoCredito', foreignKey: 'tipo_credito_id' });
Credito.belongsTo(TipoEstatusCredito, { as: 'tipoEstatusCredito', foreignKey: 'estatus_credito_id' });
Credito.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });
Credito.belongsTo(SolicitudCredito, { as: 'solicitudCredito', foreignKey: 'solicitud_credito_id' });
Credito.belongsTo(TipoEstatusContrato, { as: 'tipoEstatusContrato', foreignKey: 'estatus_contrato_id' });


module.exports = Credito;
