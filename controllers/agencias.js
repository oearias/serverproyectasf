const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const agenciaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getAgencia, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const agenciasGet = async (req, res = response) => {

    try {

        const result = await pool.query(queries.getAgencias);

        res.status(200).json(
            result.rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const agenciaPost = async (req, res = response) => {

    try {

        const { nombre, zona_id } = req.body;

        const values = [ nombre, zona_id];

        const result = await pool.query(queries.insertAgencia, values);

        res.status(200).json(
            `La agencia: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const agenciaPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, zona_id } = req.body;
        const values = [nombre, zona_id, id]

        const result = await pool.query(queries.updateAgencia, values)

        res.status(200).json(
            `La agencia: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const agenciaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteAgencia, values);

        res.status(200).json(
            `La agencia: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const agenciasGetByZonaId = async (req, res = response) => {

    const {id} = req.params;

    const values = [id];

    try {

        const { rows } = await pool.query(queries.getAgenciasByZonaId, values);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const agenciasGetByCriteria = async (req, res = response) => {

    const {criterio, palabra} = req.params;

    try {

        let sql = `SELECT a.id, a.nombre, a.zona_id, b.nombre as zona 
        FROM
        dbo.agencias a
        INNER JOIN
        dbo.zonas b
        on a.zona_id = b.id
        WHERE ${criterio} like '%${palabra}%'
        order by b.nombre, a.nombre`;

        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

module.exports = {
    agenciaGet,
    agenciasGet,
    agenciaPost,
    agenciaPut,
    agenciaDelete,
    agenciasGetByZonaId,
    agenciasGetByCriteria
}