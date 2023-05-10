const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

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
        

        const values = [ credito_id, fecha, monto, weekyear, folio, serie];
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

        const values = [observaciones, id ]

        const result = await pool.query(queries.updatePago, values);

        //Se restan los pagos cancelados (como si se estuviese eliminando)
        await pool.query(`CALL pr_update_saldos_balance_delete_pago(${id})`);

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

        if(error.code == 23503){
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

    const {criterio, palabra} = req.params;

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
    pagosGetByCreditoId,
    pagoPost,
    pagoPut,
    pagoDelete,
    pagosGetByCriteria
}