const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const zonaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getZona, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const zonasGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getZonas);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const zonaPost = async (req, res = response) => {

    try {

        const { nombre, sucursal_id } = req.body;

        const values = [ nombre, sucursal_id];

        const result = await pool.query(queries.insertZona, values);

        res.status(200).json(
            `La zona: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const zonaPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, sucursal_id } = req.body;

        const values = [nombre, sucursal_id, id]

        const result = await pool.query(queries.updateZona, values)

        res.status(200).json(
            `La zona: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const zonaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteZona, values);

        res.status(200).json(
            `La zona: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const zonasGetBySucursalId = async (req, res = response) => {

    const {id} = req.params;

    const values = [id];

    try {

        const { rows } = await pool.query(queries.getZonasBySucursalId, values);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const zonasGetByCriteria = async (req, res = response) => {

    const {criterio, palabra} = req.params;

    try {

        let sql = `SELECT a.id, a.nombre, a.sucursal_id, b.nombre as sucursal 
        FROM
        dbo.zonas a
        INNER JOIN
        dbo.sucursales b
        on a.sucursal_id = b.id
        WHERE ${criterio} like '%${palabra}%'
        order by b.nombre, a.nombre`;

        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

module.exports = {
    zonaGet,
    zonasGet,
    zonaPost,
    zonaPut,
    zonaDelete,
    zonasGetBySucursalId,
    zonasGetByCriteria
}