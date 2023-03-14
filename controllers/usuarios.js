const { response } = require('express');
const bcryptjs = require('bcryptjs');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.usuarios'

const usuarioGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getUsuario, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const usuariosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getUsuarios);

        res.status(200).json(
            rows
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const usuarioPost = async (req, res = response) => {

    try {

        req.body.created_at = new Date().toISOString();
        const { password, nombre, apellido_paterno, apellido_materno, usuario, email, role_id, created_at } = req.body;


        //Encriptamos el password
        const salt = bcryptjs.genSaltSync();
        const pass = bcryptjs.hashSync(password, salt);

        const user = {
            password: pass,
            nombre: nombre,
            apellido_paterno: apellido_paterno,
            apellido_materno: apellido_materno,
            usuario: usuario,
            email: email,
            created_at: created_at,
            role_id: role_id
        }

        let consulta = buildPostQuery(table, user);

        const { rows } = await pool.query(consulta);

        res.status(200).json(
            `El usuario: ${rows[0]['nombre']} ${rows[0]['apellido_paterno']} ha sido añadido correctamente`
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

const usuarioPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        delete req.body.id;
        delete req.body.password;

        let consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta);

        res.status(200).json(
            `El usuario: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido modificado correctamente.`
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

const usuarioDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteUsuario, values);

        res.status(200).json(
            `El usuario: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        if (error.code == 23503) {
            return res.status(405).json({
                msg: mensajes.registroRelacionado,
            })
        }

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const usuariosGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql;
        let cadena_aux;

        switch (criterio) {

            case 'a.email':

                cadena_aux = palabra.toLowerCase();

                sql = `SELECT a.id, a.nombre, a.apellido_paterno, a.apellido_materno, a.email,
                TRIM(a.nombre||' '||a.apellido_paterno||' '||COALESCE(a.apellido_materno,'')) as nombre_completo,
                b.nombre as role_nombre
                FROM dbo.usuarios a 
                LEFT JOIN
                dbo.roles b
                on a.role_id = b.id
                WHERE ${criterio} like '%${cadena_aux}%'
                ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`;

                break;

            default:

                cadena_aux = palabra.toUpperCase();

                sql = `SELECT a.id, a.nombre, a.apellido_paterno, a.apellido_materno, a.email,
                TRIM(a.nombre||' '||a.apellido_paterno||' '||COALESCE(a.apellido_materno,'')) as nombre_completo,
                b.nombre as role_nombre
                FROM dbo.usuarios a 
                LEFT JOIN
                dbo.roles b
                on a.role_id = b.id
                WHERE ${criterio} like '%${cadena_aux}%'
                ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`;

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

const usuarioChangePassword = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { password } = req.body;

        //Encriptamos el password
        const salt = bcryptjs.genSaltSync();
        const pass = bcryptjs.hashSync(password, salt);

        const values = [pass, id];

        const result = await pool.query(queries.resetPassword, values);

        res.status(200).json(
            `La contraseña ha sido modificada correctamente.`
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


module.exports = {
    usuarioGet,
    usuariosGet,
    usuarioPost,
    usuarioPut,
    usuarioDelete,
    usuariosGetByCriteria,
    usuarioChangePassword
}