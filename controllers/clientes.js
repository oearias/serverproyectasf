const { response } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');

const Cliente = require('../models/cliente');

const { Op, Sequelize } = require('sequelize');

const { buildPatchQuery, buildPostQuery, buildGetQuery, buildGetQueryById, buildDeleteQueryById } = require('../database/build-query');
const mensajes = require('../helpers/messages');
const Agencia = require('../models/agencia');
const Zona = require('../models/zona');
const Sucursal = require('../models/sucursal');
const Credito = require('../models/credito');
const Colonia = require('../models/colonia');

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

const getClientesPaginados = async (req, res = response) => {

    try {
        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        const { count, rows } = await Cliente.findAndCountAll({
            include: [
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona',
                        include: {
                            model: Sucursal,
                            as: 'sucursal'
                        }
                    }
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER(CONCAT("Cliente"."nombre", ' ', "Cliente"."apellido_paterno", ' ', "Cliente"."apellido_materno")) LIKE LOWER(:searchTerm)`),
                    Sequelize.literal(`LOWER(CONCAT("agencia->zona->sucursal"."clave", '-', "Cliente"."id")) LIKE LOWER(:searchTerm)`),
                ]
            },
            replacements: { searchTerm: `%${searchTerm}%` },
            offset,
            limit: limitPerPage,
            order: [['nombre', 'ASC']]
        });

        // Consulta para obtener la cantidad de créditos por cliente
        const clientesIds = rows.map((cliente) => cliente.id);
        const creditosCounts = await Credito.findAll({
            attributes: [
                'cliente_id',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'creditos_count']
            ],
            where: {
                cliente_id: clientesIds
            },
            group: ['cliente_id']
        });

        // Mapear la información de los clientes y agregar la cantidad de créditos
        const clientesJSON = rows.map((cliente) => {
            const creditosCount = creditosCounts.find((count) => count.cliente_id === cliente.id);
            return {
                id: cliente.id,
                num_cliente: `${cliente.agencia.zona.sucursal.clave}-${cliente.id}`,
                nombre_completo: cliente.getNombreCompleto(),
                agencia: cliente.agencia,
                num_creditos: creditosCount ? creditosCount.dataValues.creditos_count : 0
            };
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        res.status(200).json({
            clientesJSON,
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

const getClientesLimitados = async (req, res = response) => {

    try {

        const { searchTerm } = req.query;

        const clientes = await Cliente.findAll({
            include: [
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona'
                    }
                },{
                    model: Colonia,
                    as: 'colonia'
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Cliente.nombre')), 'LIKE', `%${searchTerm}%`),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('apellido_paterno')), 'LIKE', `%${searchTerm}%`),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('apellido_materno')), 'LIKE', `%${searchTerm}%`),
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.fn('CONCAT', Sequelize.col('Cliente.nombre'), ' ', Sequelize.col('apellido_paterno'), ' ', Sequelize.col('apellido_materno'))),
                        'LIKE',
                        `%${searchTerm}%`
                    ),
                ],
            },

            limit: 25,
            order: [['id', 'ASC']]
        });


        const clientesJSON = clientes.map((cliente) => {
            return {
                id: cliente.id,
                nombre_completo: cliente.getNombreCompleto(),
                fullname: `${cliente.getNombreCompleto()} | ${cliente.rfc}`,
                nombre: cliente.nombre,
                apellido_paterno: cliente.apellido_paterno,
                apellido_materno: cliente.apellido_materno,
                fecha_nacimiento: cliente.fecha_nacimiento,
                sexo: cliente.sexo,
                agencia_id: cliente.agencia.id,
                zona_id: cliente.agencia.zona.id,
                rfc: cliente.rfc,
                curp: cliente.curp,
                email: cliente.email,
                telefono: cliente.telefono,
                cp: cliente.colonia.cp,
                cruzamientos: cliente.cruzamientos,
                referencia: cliente.referencia
            }
        });

        res.status(200).json({
            clientesJSON
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const clientesGetTotal = async (req, res = response) => {

    try {

        const resultado = await pool.query(queries.getClientesTotal);

        res.status(200).json(
            resultado.rows[0].total_clientes
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

        let sql = '';
        let cadena_aux = palabra.toUpperCase();

        let select_query = queries.getClienteQueryGenerica;

        let clausula_where = '';
        let order_by = 'ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre';

        switch (criterio) {

            case 'num_cliente':

                clausula_where = `WHERE a.num_cliente = ${cadena_aux}`;

                break;

            case 'nombre_completo':

                clausula_where = `WHERE a.nombre||' '||a.apellido_paterno||' '||a.apellido_materno like  '%${cadena_aux}%' `;

                break;

            case 'zona':

                clausula_where = `WHERE c.nombre like '${cadena_aux}' `;

                break;

            case 'agencia':

                clausula_where = `WHERE b.nombre like '${cadena_aux}' `;

                break;


            default:
                clausula_where = '1 != 0';
                break;


        }

        console.log(clausula_where);

        sql = `${select_query} ${clausula_where}
                ${order_by}`;

        console.log(sql);

        const { rows } = await pool.query(sql);

        console.log(rows);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

module.exports = {
    getClientesPaginados,
    getClientesLimitados,
    clienteGet,
    clientesGet,
    clientesGetTotal,
    clientePost,
    clientePut,
    clienteDelete,
    clientesGetByCriteria
}