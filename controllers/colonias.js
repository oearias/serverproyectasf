const { response } = require('express');

const { Op, Sequelize } = require('sequelize');

const { buildPatchQuery } = require('../database/build-query');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');
const Colonia = require('../models/colonia');
const TipoAsentamiento = require('../models/tipo_asentamiento');

const table = 'dbo.colonias';

const coloniaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getColonia, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const coloniasGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getColonias);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getColoniasPaginadas = async (req, res = response) => {

    try {
        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;
        const offset = (pageNumber - 1) * limitPerPage;

        const { count, rows } = await Colonia.findAndCountAll({
            include: [
                {
                    model: TipoAsentamiento,
                    as: 'tipoAsentamiento',
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("Colonia"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"Colonia"."cp"::TEXT LIKE '%${searchTerm}%'`),
                    Sequelize.literal(`LOWER("tipoAsentamiento"."nombre") LIKE LOWER('%${searchTerm}%')`),
                ]
            },
            replacements: { searchTerm: `%${searchTerm}%` },
            offset,
            limit: limitPerPage,
            order: [['nombre', 'ASC']]
        });


        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        res.status(200).json({
            coloniasJSON: rows,
            totalPages,
            currentPage: pageNumber
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
};

const coloniaPost = async (req, res = response) => {

    try {

        delete req.body.id;

        const { nombre, cp, tipo_asentamiento_id } = req.body;

        const values = [nombre, cp, tipo_asentamiento_id];

        const result = await pool.query(queries.insertColonia, values);

        res.status(200).json(
            `La colonia: ${result.rows[0]['nombre']} ha sido añadida correctamente.`
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

const coloniaPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        //borramos el id para que no se inserte ni actualice
        delete req.body.id;
        
        const consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta)

        res.status(200).json(
            `La colonia: ${result.rows[0]['nombre']} ha sido modificada correctamente.`
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

const coloniaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteColonia, values);

        res.status(200).json(
            `La colonia: ${result.rows[0]['nombre']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const coloniasGetByCriteria = async (req, res = response) => {

    const {criterio, palabra} = req.params;

    try {

        let sql;

        if(criterio!='cp'){
            sql = `SELECT a.id, b.nombre as tipo_asentamiento, 
            b.id as tipo_asentamiento_id, a.nombre, a.cp
            FROM
            dbo.colonias a
            INNER JOIN
            dbo.tipo_asentamiento b
            on a.tipo_asentamiento_id = b.id AND LOWER(a.${criterio}) like LOWER('%${palabra}%') ORDER BY a.nombre`;
        }else{
            sql = `SELECT a.id, b.nombre as tipo_asentamiento, 
            b.id as tipo_asentamiento_id, a.nombre, a.cp
            FROM
            dbo.colonias a
            INNER JOIN
            dbo.tipo_asentamiento b
            on a.tipo_asentamiento_id = b.id AND a.${criterio} = ${palabra} ORDER BY a.nombre`;
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
    coloniaGet,
    coloniasGet,
    coloniaPost,
    coloniaPut,
    coloniaDelete,
    coloniasGetByCriteria,
    getColoniasPaginadas
}