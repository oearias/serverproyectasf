const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const roleGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getRole, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const rolesGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getRoles);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const rolesGetByUserId = async (req, res = response) => {

    try {
        const { id } = req.params;

        const values = [id];

        const { rows } = await pool.query(queries.getRolesByUserId, values);

        res.status(200).json({
            rows
        })
    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const rolePost = async (req, res = response) => {

    try {

        const { nombre, descripcion } = req.body;

        const values = [nombre, descripcion];

        const result = await pool.query(queries.insertRole, values);

        res.status(200).json(
            `El rol: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const rolePut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        const values = [nombre, descripcion, id]

        const result = await pool.query(queries.updateRole, values)

        res.status(200).json(
            `El rol: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const roleDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteRole, values);

        res.status(200).json(
            `El rol: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    roleGet,
    rolesGet,
    rolesGetByUserId,
    rolePost,
    rolePut,
    roleDelete
}