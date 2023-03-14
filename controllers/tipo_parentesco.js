const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoParentescoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTipoParentesco, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoParentescosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoParentescos);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoParentescoPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertTipoParentesco, values);

        res.status(200).json(
            `El tipo de parentesco: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoParentescoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;

        const values = [nombre, id]

        const result = await pool.query(queries.updateTipoParentesco, values)

        res.status(200).json(
            `El tipo de parentesco: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoParentescoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoParentesco, values);

        res.status(200).json(
            `El tipo de parentesco: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoParentescoGet,
    tipoParentescosGet,
    tipoParentescoPost,
    tipoParentescoPut,
    tipoParentescoDelete
}