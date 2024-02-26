const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');
const Tarifa = require('../models/tarifa');
const { Op, Sequelize } = require('sequelize');

const tarifaGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getTarifa, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {
        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const getTarifasPaginadas = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;
        const offset = (pageNumber - 1) * limitPerPage;

        const { count, rows } = await Tarifa.findAndCountAll({
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"num_semanas"::TEXT LIKE'%${searchTerm}%'`),
                    Sequelize.literal(`"monto_semanal"::TEXT LIKE '%${searchTerm}%'`),
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['estatus', 'ASC'], ['nombre', 'ASC'],]
        });


        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        res.status(200).json({
            tarifasJSON: rows,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log(error);
    }
}

const tarifasGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getTarifas);

        res.status(200).json(
            rows
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tarifasActivasGet = async (req, res = response) => {

    try {

        const rows = await Tarifa.findAll({
            where: {
                estatus: 'A'
            }
        })

        res.status(200).json(
            rows
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const tarifaPost = async (req, res = response) => {

    try {

        const { num_semanas, monto, monto_semanal, cociente, nombre, bonificaciones } = req.body;

        let cocienteConvertido = (cociente / 100);

        //const values = [ num_semanas, monto, monto_semanal, nombre];

        await Tarifa.create({
            nombre,
            monto,
            monto_semanal,
            num_semanas,
            bonificaciones,
            estatus: 'A'
        })

        //const result = await pool.query(queries.insertTarifa, values);

        res.status(201).json(
            `La tarifa ha sido añadida correctamente.`
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

const tarifaPut = async (req, res = response) => {

    try {

        const { id } = req.params;
        const { num_semanas, monto, monto_semanal, nombre, bonificaciones, estatus } = req.body;

        //let cocienteConvertido = (cociente / 100);

        //const values = [num_semanas, cocienteConvertido, nombre, id]

        //const result = await pool.query(queries.updateTarifa, values)

        const tarifaUpdateData = {
            num_semanas,
            monto,
            monto_semanal,
            nombre,
            bonificaciones,
            estatus: estatus ? 'A' : 'I'
        };

        await Tarifa.update(
            tarifaUpdateData,
            {
                where: {
                    id: id
                }
            }
        );

        res.status(200).json(
            `La tarifa ha sido modificada correctamente.`
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

const tarifaDelete = async (req, res = response) => {
    try {
        const { id } = req.params;

        // Buscar la tarifa por su ID
        const tarifa = await Tarifa.findByPk(id);

        // Verificar si la tarifa existe
        if (!tarifa) {
            return res.status(404).json({
                msg: 'La tarifa no fue encontrada.'
            });
        }

        // Eliminar la tarifa
        await tarifa.destroy();

        res.status(200).json({
            msg: 'La tarifa ha sido eliminada correctamente.'
        });
        
    } catch (error) {
        console.log(error);

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(405).json({
                msg: 'La tarifa no puede ser eliminada porque tiene registros relacionados en otras tablas.'
            });
        }

        res.status(500).json({
            msg: 'Error interno del servidor.'
        });
    }
};


module.exports = {
    tarifaGet,
    tarifasGet,
    tarifasActivasGet,
    tarifaPost,
    tarifaPut,
    tarifaDelete,
    getTarifasPaginadas
}