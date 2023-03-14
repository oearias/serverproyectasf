const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoFuenteFinanciamientoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTipoFuenteFinanciamiento, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoFuenteFinanciamientosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoFuenteFinanciamientos);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoFuenteFinanciamientoPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertTipoFuenteFinanciamiento, values);

        res.status(200).json(
            `El tipo de fuente de financiamiento: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoFuenteFinanciamientoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;

        const values = [nombre, id]

        const result = await pool.query(queries.updateTipoFuenteFinanciamiento, values)

        res.status(200).json(
            `El tipo de fuente de financiamiento: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoFuenteFinanciamientoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoFuenteFinanciamiento, values);

        res.status(200).json(
            `El tipo de fuente de financiamiento: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoFuenteFinanciamientoGet,
    tipoFuenteFinanciamientosGet,
    tipoFuenteFinanciamientoPost,
    tipoFuenteFinanciamientoPut,
    tipoFuenteFinanciamientoDelete
}