const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoEstatusSolicitudGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTipoEstatusSolicitud, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoEstatusSolicitudesGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoEstatusSolicitudes);

        res.status(200).json(
            rows
        );
 
    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoEstatusSolicitudPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertTipoEstatusSolicitud, values);

        res.status(200).json(
            `El tipo de estatus de solicitud: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoEstatusSolicitudPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;

        const values = [ nombre, id]

        const result = await pool.query(queries.updateTipoEstatusSolicitud, values)

        res.status(200).json(
            `El tipo de estatus de solicitud: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoEstatusSolicitudDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoEstatusSolicitud, values);

        res.status(200).json(
            `El tipo de estatus de solicitud: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoEstatusSolicitudGet,
    tipoEstatusSolicitudesGet,
    tipoEstatusSolicitudPost,
    tipoEstatusSolicitudPut,
    tipoEstatusSolicitudDelete
}