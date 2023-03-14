const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const tarifaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTarifa, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const tarifasGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTarifas);

        res.status(200).json(
            rows
        );
 
    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tarifaPost = async (req, res = response) => {

    try {

        const { num_semanas, cociente, nombre } = req.body;

        let cocienteConvertido = (cociente / 100);

        const values = [ num_semanas, cocienteConvertido, nombre];

        const result = await pool.query(queries.insertTarifa, values);

        res.status(201).json(
            `La tarifa: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const tarifaPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { num_semanas, cociente, nombre } = req.body;

        let cocienteConvertido = (cociente / 100);

        const values = [num_semanas, cocienteConvertido, nombre, id]

        const result = await pool.query(queries.updateTarifa, values)

        res.status(200).json(
            `La tarifa: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const tarifaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteTarifa, values);

        res.status(200).json(
            `La tarifa: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        console.log(error);

        if(error.code == 23503){
            return res.status(405).json({
                msg: mensajes.registroRelacionado,
                tabla: error.table
            })
        }

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    tarifaGet,
    tarifasGet,
    tarifaPost,
    tarifaPut,
    tarifaDelete
}