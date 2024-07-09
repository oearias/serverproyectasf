const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Tarifa = require('../models/tarifa');
const TipoCredito = require('./tipo_credito');
const Cliente = require('./cliente');
const TipoEstatusCredito = require('./tipo_estatus_credito')
const SolicitudCredito = require('./solicitud_credito');
const TipoEstatusContrato = require('./tipo_estatus_contrato');

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

Credito.devuelveRegistrosReporteCartas = async (semana_id, zona_id, agencia_id) => {

    try {

        let query;

        query = `
    
        (
            SELECT 
                a.credito_id,
                a.fecha_inicio_real,
                a.zona_id,
                a.zona,
                a.agencia_id,
                a.agencia,
                a.num_contrato,
                a.num_contrato_historico,
                a.nombre_completo,
                a.direccion,
                a.telefono,
                a.monto as monto_otorgado,
                a.monto_semanal,
                TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
                a.fecha_fin_prog as fecha_fin_prog2, 
                a.estatus_credito_id,
                a.estatus_credito,
                a.monto_total,
                COALESCE(a.monto_total_pagado,0) as monto_total_pagado,
                (a.monto_total - COALESCE(a.monto_total_pagado,0) ) as monto_total_restante,
                a.total_penalizaciones
            FROM 
                dbo.vwm_creditos a
            INNER JOIN 
                dbo.balance_semanal b 
                ON a.credito_id = b.credito_id
            INNER JOIN 
                dbo.semanas c 
                ON b.fecha_inicio = c.fecha_inicio 
                AND b.fecha_fin = c.fecha_fin 
                AND b.weekyear = c.weekyear
            WHERE 
                c.id = ${semana_id} AND a.entregado = 1 ` 

        if(zona_id){
            query += `AND a.zona_id = ${zona_id} `
        }

        if(agencia_id){
            query += `AND a.agencia_id = ${agencia_id} `
        }
                    
        query +=

        `UNION 
            
            SELECT
                a.credito_id,
                a.fecha_inicio_real,
                a.zona_id,
                a.zona,
                a.agencia_id,
                a.agencia,
                a.num_contrato,
                a.num_contrato_historico,
                a.nombre_completo,
                a.direccion,
                a.telefono,
                a.monto as monto_otorgado,
                a.monto_semanal,
                TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
                a.fecha_fin_prog as fecha_fin_prog2, 
                a.estatus_credito_id,
                a.estatus_credito,
                a.monto_total,
                COALESCE(a.monto_total_pagado,0) as monto_total_pagado,
                (a.monto_total - COALESCE(a.monto_total_pagado,0) ) as monto_total_restante,
                a.total_penalizaciones
            FROM 
                dbo.vwm_creditos a
            JOIN 
                dbo.semanas c 
                ON a.fecha_fin_prog <= c.fecha_inicio
            WHERE c.id = ${semana_id}
            AND a.estatus_credito_id = 2 
            AND a.entregado = 1 `

        if(zona_id){
            query += `AND a.zona_id = ${zona_id} `
        }

        if(agencia_id){
            query += `AND a.agencia_id = ${agencia_id} `
        }
        
    
    query += `)

    
        ORDER BY zona, agencia, nombre_completo
        
        `;

        console.log(query);

        const rows = await sequelize.query(query);

        return rows;
        
    } catch (error) {
        
        console.log(error);

    }


}

module.exports = Credito;


