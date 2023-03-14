const { response } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery, buildGetQuery, buildGetQueryById, buildDeleteQueryById } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.blacklist';

const blackListGetByClienteId = async (req, res = response) => {

    try {

        const { id } = req.params;

        const consulta = buildGetQueryById(table, id);

        const { rows } = await pool.query(consulta);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const blackListGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getBlacklist);

        res.status(200).json({
            rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const blackListPost = async (req, res = response) => {

    try {

        //req.body.created_at = new Date().toISOString();

        let consulta = buildPostQuery(table, req.body);

        const result = await pool.query(consulta);

        if (result.rowCount != 1) {
            return res.status(500).json({
                msg: mensajes.registroNoInsert
            });
        }

        console.log(result);

        res.status(200).json(
            `El(La) cliente: ${result.rows[0]['cliente_id']} ha sido añadido(a) correctamente a la lista negra.`
        );

    } catch (error) {

        const errors = [{
            code: error.code, 
            msg: error.constraint,
            param: error.detail
        }]

        if (error.code == 23505) {
            return res.status(500).json({
                msg: 'El valor que intenta insertar se encuentra duplicado'
            })
        }

        if (error.code == 23503) {
            return res.status(500).json({
                msg: `El valor otorgado a ${error['constraint']} no existe en su respectiva tabla`
            })
        }

        if (errors)

            return res.status(500).json({
                errors
            })

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

// const blackListPut = async (req, res = response) => {

//     try {

//         const { id } = req.params;

//         let consulta = buildPatchQuery(id, table, req.body);

//         const result = await pool.query(consulta);

//         res.status(200).json(
//             `El(La) cliente: ${result.rows[0]['nombre']} ${result.rows[0]['apellido_paterno']} ha sido modificado(a) correctamente.`
//         );

//     } catch (error) {

//         const errors = [{
//             msg: error.constraint,
//             param: error.detail
//         }]

//         if (errors)

//             return res.status(500).json({
//                 errors
//             })

//         res.status(500).json({
//             msg: mensajes.errorInterno
//         });
//     }
// }

const blackListDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        const values = [id]

        const result = await pool.query(queries.deleteBlackListByUserId, values);

        res.status(200).json(
            `El(La) cliente: ${result.rows[0]['cliente_id']} ha sido eliminado(a) correctamente de la lista negra.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    blackListGetByClienteId,
    blackListGet,
    blackListPost,
    blackListDelete
}