const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const servicioGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getServicio, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const serviciosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getServicios);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const servicioPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [nombre];

        const result = await pool.query(queries.insertServicio, values);

        res.status(200).json(
            `El servicio: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const servicioPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;
        const values = [nombre, id]

        const result = await pool.query(queries.updateServicio, values)

        res.status(200).json(
            `El servicio: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const serviciosDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteServicio, values);

        res.status(200).json(
            `El servicio: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    servicioGet,
    serviciosGet,
    servicioPost,
    servicioPut,
    serviciosDelete
}