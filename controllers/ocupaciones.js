const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const ocupacionGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getOcupacion, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const ocupacionesGet = async (req, res = response) => {

    try {

        const result = await pool.query(queries.getOcupaciones);

        res.status(200).json(
            result.rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const ocupacionPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertOcupacion, values);

        res.status(200).json(
            `La ocupación: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const ocupacionPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre} = req.body;

        const values = [nombre, id]

        const result = await pool.query(queries.updateOcupacion, values)

        res.status(200).json(
            `La ocupacion: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const ocupacionDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteOcupacion, values);

        res.status(200).json(
            `La ocupacion: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    ocupacionGet,
    ocupacionesGet,
    ocupacionPost,
    ocupacionPut,
    ocupacionDelete
}