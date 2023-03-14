const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoCreditoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTipoCredito, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoCreditosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoCreditos);

        res.status(200).json(
            rows
        );
 
    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoCreditoPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertTipoCredito, values);

        res.status(200).json(
            `El tipo de crédito: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoCreditoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;

        const values = [ nombre, id]

        const result = await pool.query(queries.updateTipoCredito, values)

        res.status(200).json(
            `El tipo de crédito: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoCreditoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoCredito, values);

        res.status(200).json(
            `El tipo de crédito: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoCreditoGet,
    tipoCreditosGet,
    tipoCreditoPost,
    tipoCreditoPut,
    tipoCreditoDelete
}