const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const montoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getMonto, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const montosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getMontos);

        res.status(200).json(
            rows
        );

    } catch (error) {

        console.log(error);
        
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const montoPost = async (req, res = response) => {

    try {

        const { monto, tarifa_id } = req.body;

        const values = [ monto, tarifa_id];

        const result = await pool.query(queries.insertMonto, values);

        res.status(200).json(
            `El monto: ${result.rows[0]['monto']} ha sido añadido correctamente.`
        );

    } catch (error) {

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

const montoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { monto, tarifa_id } = req.body;

        const values = [monto, tarifa_id, id]

        const result = await pool.query(queries.updateMonto, values)

        res.status(200).json(
            `El monto: ${result.rows[0]['monto']} ha sido modificado correctamente.`
        );
    } catch (error) {

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

const montoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteMonto, values);

        res.status(200).json(
            `El monto de: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}


module.exports = {
    montoGet,
    montosGet,
    montoPost,
    montoPut,
    montoDelete
}