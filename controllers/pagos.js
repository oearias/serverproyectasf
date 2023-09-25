const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { Op, Sequelize } = require('sequelize');
const mensajes = require('../helpers/messages');

const Pago = require('../models/pago');
const Credito = require('../models/credito');
const Cliente = require('../models/cliente');

//Obtiene el detalle del pago
const pagoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getPago, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const pagosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getPagos);

        res.status(200).json(
            rows
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
}

const getPagosPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        const { count, rows } = await Pago.findAndCountAll({
            include: {
                model: Credito,
                as: 'credito',
                include: {
                    model: Cliente,
                    as: 'cliente'
                }
            },
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("credito->cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("credito->cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("credito->cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER(CONCAT("credito->cliente"."nombre", ' ', "credito->cliente"."apellido_paterno", ' ', "credito->cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"credito"."num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                    Sequelize.literal(`LOWER("folio") LIKE LOWER('%${searchTerm}%')`), // Búsqueda por folio
                ]
            },
            offset,
            limit: limitPerPage
        });
        
        

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const pagosJSON = rows.map((pago) => {
            return {
                id: pago.id,
                folio: pago.folio,
                num_contrato: pago.credito.num_contrato,
                cliente: pago.credito.cliente.getNombreCompleto(),
                fecha: pago.fecha,
                monto: pago.monto,
                cancelado: pago.cancelado
            }
        })

        res.status(200).json({
            pagosJSON,
            totalPages,
            currentPage: pageNumber
        })

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }

}

const getCreditoByPagoId = async (req, res= response) =>{

    try {

        const { pago_id } = req.body;

        const pagos = await Pago.findAll({
            include:{
                model: Credito,
                as: 'credito',
                include:{
                    model: Cliente,
                    as: 'cliente'
                }
            },
            where: {
                id: pago_id
            }
        });

        const creditosJSON = pagos.map((pago)=>{
            return  {
                id: pago.credito.id,
                num_contrato: pago.num_contrato,
                nombre: `${pago.credito.num_contrato} | ${pago.credito.cliente.num_cliente} | ${pago.credito.cliente.getNombreCompleto()}`,
                nombre_completo: pago.credito.cliente.getNombreCompleto(),
            }
        });

        res.status(200).json({
            creditosJSON
        });

        
    } catch (error) {
        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }

}

const pagosGetByCreditoId = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getPagosByCreditoId, values);

        res.status(200).json(
            rows
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
}

const pagoPost = async (req, res = response) => {

    try {

        const { credito_id, fecha, monto, folio, weekyear } = req.body;

        const arreglo_credito_id = [credito_id]

        //Obtenemos la serie
        const resultado = await pool.query(queries.getSeriePago, arreglo_credito_id);

        const agencia = resultado.rows[0]['agencia'];
        const zona = resultado.rows[0]['zona'];
        const serie = `${zona}-${agencia}-${folio}`;

        console.log(credito_id, fecha, monto, weekyear, folio, serie);


        const values = [credito_id, fecha, monto, weekyear, folio, serie];
        const result = await pool.query(queries.insertPago, values);

        //Esta linea tengo que ver si todavía es util
        //vamos a suspenderla por lo pronto
        await pool.query(`CALL pr_update_saldos_balance_after_pago(${credito_id},${monto},'${fecha}')`);

        await pool.query(`CALL pr_calcula_recargo_credito_test3(${credito_id},'${fecha}')`);

        res.status(201).json(
            `El pago ha sido añadido correctamente.`
        );

    } catch (error) {

        console.log(error);

        const errors = [{
            msg: error.constraint,
            param: error.detail
        }]

        if (errors)

            return res.status(500).json({
                errors
            });

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

//Esto cancela el pago
const pagoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { credito_id, fecha, monto, observaciones } = req.body;

        const values = [observaciones, id]

        const result = await pool.query(queries.updatePago, values);

        //Se restan los pagos cancelados (como si se estuviese eliminando)
        await pool.query(`CALL pr_update_saldos_balance_delete_pago(${id})`);

        console.log('credito_id', credito_id);
        console.log('fecha', fecha);

        await pool.query(`CALL pr_calcula_recargo_credito_test3(${credito_id},'${fecha}')`);

        res.status(200).json(
            `El pago ha sido cancelado correctamente.`
        );

    } catch (error) {

        console.log(error);

        const errors = [{
            msg: error.constraint,
            param: error.detail
        }]

        if (errors)

            return res.status(500).json({
                errors
            })

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const pagoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]


        await pool.query(`CALL pr_update_saldos_balance_delete_pago(${id})`);
        const result = await pool.query(queries.deletePago, values);


        res.status(200).json(
            `El pago: ${result.rows[0]['folio']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        console.log(error);

        if (error.code == 23503) {
            return res.status(405).json({
                msg: mensajes.registroRelacionado,
                tabla: error.table
            })
        }

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const pagosGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql = `SELECT a.id, a.nombre, a.zona_id, b.nombre as zona 
        FROM
        dbo.agencias a
        INNER JOIN
        dbo.zonas b
        on a.zona_id = b.id
        WHERE ${criterio} like '%${palabra}%'
        order by b.nombre, a.nombre`;

        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

module.exports = {
    pagoGet,
    pagosGet,
    getPagosPaginados,
    pagosGetByCreditoId,
    pagoPost,
    pagoPut,
    pagoDelete,
    pagosGetByCriteria,
    getCreditoByPagoId
}