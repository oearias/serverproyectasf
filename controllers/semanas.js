const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');
const { Op, Sequelize } = require('sequelize');
const Semana = require('../models/semana');

const semanaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const result = await pool.query(queries.getSemana, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
} 

const semanasGet = async (req, res = response) => {

    try {

        const rows = await Semana.findAll({
        });

        //const { rows } = await pool.query(queries.getSemanas);

        res.status(200).json(
            rows
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const semanaOpenedGet = async (req, res = response) => {

    try {

        const semana = await Semana.findAll({
            where:{
                estatus: true
            }
        });

        res.status(200).json(
            semana[0]
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getSemanasPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        let searchCriteria = {
            [Op.or]: [
                Sequelize.where(Sequelize.cast(Sequelize.col('weekyear'), 'TEXT'), 'LIKE', `%${searchTerm}%`),
                {
                    serie: {
                        [Op.like]: `%${searchTerm}%` // Búsqueda similar a LIKE en la propiedad 'serie'
                    }
                }
            ]
        };

        if (searchTerm === 'ABIERTA' || searchTerm === 'abierta') {

            searchCriteria = {
                [Op.or]: [
                    searchCriteria,
                    {
                        estatus: true
                    }
                ]
            };
        }

        const { count, rows } = await Semana.findAndCountAll({
            where: searchCriteria,
            offset,
            limit: limitPerPage,
            order: [
                ['year', 'DESC'],
                ['weekyear', 'DESC']
            ]
        });

        const semanasJSON = rows.map((semana) => {
            return {
                id: semana.id,
                fecha_inicio: semana.fecha_inicio,
                fecha_fin: semana.fecha_fin,
                weekyear: semana.weekyear,
                year: semana.year,
                estatus: semana.estatus,
                serie: semana.serie
            };
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        res.status(200).json({
            semanasJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
}

const semanaPost = async (req, res = response) => {

    try {

        const { fecha_inicio, fecha_fin, weekyear, year, estatus } = req.body;

        const values = [fecha_inicio, fecha_fin, weekyear, year, estatus];

        //Cerramos todas las semanas y luego insertamos la nueva abierta si el estatus es igual a true
        if (estatus === true) {

            await pool.query('UPDATE dbo.semanas SET estatus = false');
        }

        const result = await pool.query(queries.insertSemana, values);

        res.status(200).json(
            `La semana: ${result.rows[0]['weekyear']} ha sido añadida correctamente.`
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

const semanaPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { fecha_inicio, fecha_fin, weekyear, year, estatus } = req.body;
        const values = [fecha_inicio, fecha_fin, weekyear, year, estatus, id];

        //Cerramos todas las semanas y luego insertamos la nueva abierta si el estatus es igual a true
        if (estatus === true) {

            await pool.query('UPDATE dbo.semanas SET estatus = false');
        }

        const result = await pool.query(queries.updateSemana, values)

        res.status(200).json(
            `La semana: ${result.rows[0]['weekyear']} ha sido modificada correctamente.`
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

const semanaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        const result = await pool.query(queries.deleteSemana, values);

        res.status(200).json(
            `La semana: ${result.rows[0]['weekyear']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const semanasGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql;

        switch (criterio) {

            case 'estatus':

                sql = `
                    SELECT 
                        a.id, a.weekyear, a.estatus, a.year, a.fecha_inicio, a.fecha_fin, serie
                    FROM
                        dbo.semanas a
                    WHERE a.${criterio} = ${palabra} ORDER BY a.year, a.weekyear`;
                break;

            case 'serie':

                sql = `
                    SELECT 
                        a.id, a.weekyear, a.estatus, a.year, a.fecha_inicio, a.fecha_fin, serie
                    FROM
                        dbo.semanas a
                    WHERE a.${criterio} like '%${palabra}%' ORDER BY a.year, a.weekyear`;
                break;

            default:

                sql = `
                    SELECT 
                        a.id, a.weekyear, a.estatus, a.year, a.fecha_inicio, a.fecha_fin, serie
                    FROM
                        dbo.semanas a
                    WHERE a.${criterio} = ${palabra} ORDER BY a.year, a.weekyear`;
                break;

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

const yearPost = async (req, res = response) => {

    try {

        const { year, num_semanas, fecha_inicio, } = req.body;

        await pool.query(`CALL pr_create_weekyear(${num_semanas}, ${year}, '${fecha_inicio}')`);

        res.status(200).json(
            `El año: ${year} ha sido añadido correctamente.`
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

module.exports = {
    semanaGet,
    semanasGet,
    semanaOpenedGet,
    semanaPost,
    semanaPut,
    semanaDelete,
    semanasGetByCriteria,
    yearPost,
    getSemanasPaginados,
}