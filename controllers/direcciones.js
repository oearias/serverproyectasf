const { response } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.direcciones'

const direccionGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getDireccion, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const direccionesGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getDirecciones);

        res.status(200).json({
            rows
        });

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const direccionPost = async (req, res = response) => {

    try {

        let consulta = buildPostQuery(table, req.body);

        const result = await pool.query(consulta);

        res.status(200).json(
            `La dirección: ${result.rows[0]['calle']} ${result.rows[0]['num_ext']}  ha sido añadida correctamente.`
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

const direccionPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        let consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta);

        res.status(200).json(
            `La dirección: ${result.rows[0]['calle']} ${result.rows[0]['num_ext']} ha sido modificada correctamente.`
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

const direccionDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteDireccion, values);

        res.status(200).json(
            `La direccion: ${result.rows[0]['calle']} ${result.rows[0]['num_ext']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    direccionesGet,
    direccionGet,
    direccionPost,
    direccionPut,
    direccionDelete
}