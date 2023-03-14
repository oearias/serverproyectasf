const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const groupGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getGroup, values);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const groupsGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getGroups);

        res.status(200).json({
            rows
        });

    } catch (error) {

        console.log(error.message);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const groupPost = async (req, res = response) => {

    try {

        const { nombre, descripcion } = req.body;

        const values = [ nombre, descripcion ];

        const result = await pool.query(queries.insertGroup, values);

        res.status(200).json(
            `El grupo: ${result.rows[0]['nombre']} ha sido añadido correctamente.`
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

const groupPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        const values = [nombre, descripcion, id];

        const result = await pool.query(queries.updateGroup, values);

        //TODO: Actualizar todos los metodos de los controller con esta condicion
        if(result.rowCount === 0){
            return res.status(500).json({
                msg: 'No se pudo actualizar el registro por que no se encontró ningún id asociado.'
            })
        }

        res.status(200).json(
            `El grupo: ${result.rows[0]['nombre']} ha sido modificado correctamente.`
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

const groupDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteGroup, values);

        res.status(200).json(
            `El grupo: ${result.rows[0]['nombre']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    groupGet,
    groupsGet,
    groupPost,
    groupPut,
    groupDelete
}