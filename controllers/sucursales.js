const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const sucursalGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getSucursal, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const sucursalesGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getSucursales);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const sucursalPost = async (req, res = response) => {

    try {

        const { nombre, clave } = req.body;

        const values = [nombre, clave];

        const result = await pool.query(queries.insertSucursal, values);

        res.status(200).json(
            `La sucursal: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const sucursalPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, clave } = req.body;
        const values = [nombre, clave, id]

        const result = await pool.query(queries.updateSucursal, values)

        res.status(200).json(
            `La sucursal: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const sucursalDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteSucursal, values);

        res.status(200).json(
            `La sucursal: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const sucursalesGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql = `SELECT 
            a.id, a.nombre, a.clave
            FROM
            dbo.sucursales a
            WHERE LOWER(a.${criterio}) like LOWER('%${palabra}%') ORDER BY a.nombre`;


        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

module.exports = {
    sucursalGet,
    sucursalesGet,
    sucursalPost,
    sucursalPut,
    sucursalDelete,
    sucursalesGetByCriteria
}