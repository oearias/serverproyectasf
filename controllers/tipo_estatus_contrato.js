const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tipoEstatusContratoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTipoEstatusContrato, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tipoEstatusContratosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTipoEstatusContratos);

        res.status(200).json({
            rows
        });
 
    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tipoEstatusContratoPost = async (req, res = response) => {

    try {

        const { nombre } = req.body;

        const values = [ nombre ];

        const result = await pool.query(queries.insertTipoEstatusContrato, values);

        res.status(200).json(
            `El tipo de estatus de contrato: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const tipoEstatusContratoPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre } = req.body;

        const values = [ nombre, id]

        const result = await pool.query(queries.updateTipoEstatusContrato, values)

        res.status(200).json(
            `El tipo de estatus de contrato: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const tipoEstatusContratoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTipoEstatusContrato, values);

        res.status(200).json(
            `El tipo de estatus de contrato: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tipoEstatusContratoGet,
    tipoEstatusContratosGet,
    tipoEstatusContratoPost,
    tipoEstatusContratoPut,
    tipoEstatusContratoDelete
}