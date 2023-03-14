const { response} = require('express');
const { buildGetQueryUserGroup, buildPostQuery, buildPatchQuery, buildDeleteQueryById } = require('../database/build-query');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const table = 'dbo.user_group';

const userGroupGetByDynamicId = async (req, res = response) => {

    try {

        const { id, criterio } = req.params;

        let campo;

        switch (criterio){

            case 'user_group': campo = 'a.id';
            break;

            case 'usuario': campo = 'b.id';
            break;

            case 'group': campo = 'c.id';
            break;
        }

        const consulta = buildGetQueryUserGroup(id, campo);

        const { rows } = await pool.query(consulta);

        res.status(200).json({
            rows
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const userGroupsGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getUserGroups);

        res.status(200).json({
            rows
        });

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const userGroupPost = async (req, res = response) => {

    try {

        const consulta = buildPostQuery(table, req.body);

        const result = await pool.query(consulta);

        if(result.rowCount != 1){
            return res.status(500).json({
                msg: mensajes.registroNoInsert
            });
        }

        res.status(200).json(
            mensajes.registroInsert
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

const userGroupPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        const consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta);

        if(result.rowCount != 1){
            return res.status(500).json({
                msg: mensajes.registroNoUpdate
            });
        }

        res.status(200).json(
            mensajes.registroUpdate
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

const userGroupDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        const consulta = buildDeleteQueryById(table, id)

        const result = await pool.query(consulta);

        res.status(200).json(
            mensajes.registroDelete
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

module.exports = {
    userGroupGetByDynamicId,
    userGroupsGet,
    userGroupPost,
    userGroupPut,
    userGroupDelete
}