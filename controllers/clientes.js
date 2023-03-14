const { response } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery, buildGetQuery, buildGetQueryById, buildDeleteQueryById } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.clientes';

const clienteGet = async (req, res = response) => {

    try {

        const { id } = req.params;

        const values = [id];

        const result = await pool.query(queries.getCliente, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const clientesGet = async (req, res = response) => {

    try {

        const result = await pool.query(queries.getClientes);

        res.status(200).json(
            result.rows
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const clientePost = async (req, res = response) => {

    try {

        //req.body.created_at = new Date().toISOString();
        delete req.body.id;
        delete req.body.sucursal_id;
        delete req.body.zona_id;

        let consulta = buildPostQuery(table, req.body);

        const result = await pool.query(consulta);

        if (result.rowCount != 1) {
            return res.status(500).json({
                msg: mensajes.registroNoInsert
            });
        }

        res.status(200).json(
            `El(La) cliente: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido añadido(a) correctamente.`
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

const clientePut = async (req, res = response) => {

    try {

        const { id } = req.params;

        console.log(req.body);

        //borramos el id para que no se inserte ni actualice
        delete req.body.id;
        delete req.body.sucursal_id;
        delete req.body.zona_id;

        let consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta);

        res.status(200).json(
            `El(La) cliente: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido modificado(a) correctamente.`
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

const clienteDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        const consulta = buildDeleteQueryById(table, id)

        const result = await pool.query(consulta);

        res.status(200).json(
            `El(La) cliente: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido eliminado(a) correctamente.`
        );

    } catch (error) {

        console.log(error);

        if (error.code == 23503) {
            return res.status(405).json({
                msg: mensajes.registroRelacionado,
                tabla: 'Solicitudes'
            })
        }

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const clientesGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql;

        if (criterio != 'num_cliente') {
            sql = `SELECT 
            a.id, a.num_cliente, b.clave||'-'||a.num_cliente as num_cliente2, 
            a.nombre, a.apellido_paterno, a.apellido_materno, 
            a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email 
            FROM dbo.clientes a, dbo.sucursales b 
            WHERE a.sucursal_id = b.id AND a.${criterio} like '%${palabra}%' ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`;
        } else {
            sql = `SELECT 
            a.id, a.num_cliente, b.clave||'-'||a.num_cliente as num_cliente2, 
            a.nombre, a.apellido_paterno, a.apellido_materno, 
            a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email 
            FROM dbo.clientes a, dbo.sucursales b 
            WHERE a.sucursal_id = b.id AND a.${criterio} = ${palabra} ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`;
        }


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
    clienteGet,
    clientesGet,
    clientePost,
    clientePut,
    clienteDelete,
    clientesGetByCriteria
}