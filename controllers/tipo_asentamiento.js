const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoAsentamientoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getTipoAsentamiento, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoAsentamientosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoAsentamientos);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoAsentamientoPost = async (req, res = response) => {

    try {

        const { nombre, abreviatura } = req.body;

        const values = [ nombre, abreviatura ];

        const result = await pool.query(queries.insertTipoAsentamiento, values);

        res.status(200).json(
            `El tipo de asentamiento: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoAsentamientoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, abreviatura } = req.body;

        const values = [nombre, abreviatura, id]

        const result = await pool.query(queries.updateTipoAsentamiento, values)

        res.status(200).json(
            `El tipo de asentamiento: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoAsentamientoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoAsentamiento, values);

        res.status(200).json(
            `El tipo de asentamiento: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoAsentamientoGet,
    tipoAsentamientosGet,
    tipoAsentamientoPost,
    tipoAsentamientoPut,
    tipoAsentamientoDelete
}