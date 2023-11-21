const { response } = require('express');
const pool = require('../database/connection');

const puppeteer = require('puppeteer');
const fs = require('fs');
const { handlebars } = require('hbs');

const merger = require('easy-pdf-merge');
const path = require('path');

const PDFDocument = require('pdf-lib').PDFDocument

const { Op, Sequelize } = require('sequelize');


const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQueryReturningId } = require('../database/build-query');
const mensajes = require('../helpers/messages');
const { generateAmortizacion, devuelve_num_dias_penalizaciones, devuelve_grand_total } = require('../helpers/calculateAmortizacion');
const Credito = require('../models/credito');
const Tarifa = require('../models/tarifa');
const Colonia = require('../models/colonia');
const Cliente = require('../models/cliente');
const SolicitudCredito = require('../models/solicitud_credito');
const Agencia = require('../models/agencia');
const Zona = require('../models/zona');
const TipoEstatusContrato = require('../models/tipo_estatus_contrato');
const TipoEstatusCredito = require('../models/tipo_estatus_credito');
const TipoCredito = require('../models/tipo_credito');
const Pago = require('../models/pago');
const Semana = require('../models/semana');




const table = 'dbo.creditos'

const creditoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];


        const { rows } = await pool.query(queries.getCredito, values);

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

const creditosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getCreditos);

        const cliente_id = rows[0]?.cliente_id;

        const values = [cliente_id]

        const result = await pool.query(queries.getCliente, values);

        if (result.rows[0]) {
            rows[0].cliente = result.rows[0];
        }

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

const creditosGetTotal = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getCreditosTotales);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditoOptimizado = async (req, res = response) => {

    try {

        const { credito_id } = req.body;


        const credito = await Credito.findOne({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                },
                {
                    model: TipoCredito,
                    as: 'tipoCredito'
                }
            ],
            where: {
                id: credito_id,
            },
            order: [['id', 'ASC']],
        });

        if (credito) {
            credito.tarifa_id = credito.tarifa.tarifa_id
            credito.tipoCredito = credito.tipoCredito
            credito.monto_semanal = (credito.monto_total / credito.tarifa.num_semanas)
            credito.cliente.dataValues.nombre_completo = `${credito.cliente.nombre} ${credito.cliente.apellido_paterno} ${credito.cliente.apellido_materno}`
        }

        console.log(credito.cliente.dataValues);


        // const creditosJSON = creditos.map((credito) => {
        //     return {
        //         id: credito.id,
        //         num_contrato: credito.num_contrato,
        //         nombre: `${credito.num_contrato} | ${credito.cliente.num_cliente} | ${credito.cliente.getNombreCompleto()}`,
        //         nombre_completo: credito.cliente.getNombreCompleto(),
        //         zona: credito.cliente.agencia.zona.nombre,
        //         agencia: credito.cliente.agencia.nombre,
        //         monto_otorgado: credito.monto_otorgado,
        //         estatus_contrato: credito.tipoEstatusContrato.nombre,
        //         estatus_credito: credito.tipoEstatusCredito.nombre,
        //         entregado: credito.entregado,
        //         no_entregado: credito.no_entregado,
        //         num_cheque: credito.num_cheque
        //     }
        // })


        res.status(200).json(
            credito
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await Credito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const creditosJSON = rows.map((credito) => {
            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                num_contrato_historico: credito.num_contrato_historico,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito?.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque
            }
        })


        res.status(200).json({
            creditosJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosInversionPositivaPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await Credito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                        ]
                    },
                    {
                        inversion_positiva: true
                    }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const creditosJSON = rows.map((credito) => {
            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque
            }
        })


        res.status(200).json({
            creditosJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosProgramacionEntregaPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await Credito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: SolicitudCredito,
                    as: 'solicitudCredito'
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                        ]
                    },
                    {
                        preaprobado: {
                            [Op.eq]: 1
                        }
                    }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const creditosJSON = rows.map((credito) => {
            return {
                id: credito.id,
                solicitud_credito_id: credito.solicitud_credito_id,
                num_contrato: credito.num_contrato,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                fecha_entrega_prog: credito.fecha_entrega_prog,
                fecha_inicio_prog: credito.fecha_inicio_prog,
                hora_entrega: credito.hora_entrega,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque,
                num_semanas: credito.tarifa.num_semanas,
                motivo: credito.motivo,
            }
        })


        res.status(200).json({
            creditosJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

//Este ya no se utiliza por que se obtienen los datos mediante getcreditosprogramacionentregapaginados y ya luego se filtra por condiciones especificas
//commo que tenga todos los datos completos
const getCreditosMarcarEntregados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await Credito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: SolicitudCredito,
                    as: 'solicitudCredito'
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                        ]
                    },
                    {
                        preaprobado: {
                            [Op.eq]: 1
                        }
                    }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const creditosJSON = rows.map((credito) => {
            return {
                id: credito.id,
                solicitud_credito_id: credito.solicitud_credito_id,
                num_contrato: credito.num_contrato,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                fecha_entrega_prog: credito.fecha_entrega_prog,
                fecha_inicio_prog: credito.fecha_inicio_prog,
                hora_entrega: credito.hora_entrega,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque,
                num_semanas: credito.tarifa.num_semanas,
                motivo: credito.motivo,
            }
        });


        res.status(200).json({
            creditosJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosByClienteId = async (req, res = response) => {

    try {

        const { cliente_id } = req.body
        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await Credito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                cliente_id: cliente_id
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });


        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);



        const creditosJSON = await Promise.all(rows.map(async (credito) => {

            const ultimoPago = await Pago.findOne({
                where: {
                    credito_id: credito.id,
                    // monto: {
                    //     [Op.gte]: credito.monto_semanal,
                    // },
                },
                order: [['fecha', 'DESC']],
                limit: 1
            });

            if (ultimoPago) {

                console.log('entra al ultimo pago');

                //Este fue el ultimo pago, pero debo de saber si fue completo

                fechaOriginal = ultimoPago.fecha;

                const partesFecha = fechaOriginal.split('-'); // Dividimos la fecha en año, mes y día
                fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;



            } else {

                fechaFormateada = '';

            }

            //Penalizaciones
            const num_penalizaciones = await Credito.sequelize.query(
                'SELECT fu_calcula_dias_penalizaciones(:param1) as penalizaciones',
                {
                    replacements: { param1: credito.id },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            const total_penalizaciones = await Credito.sequelize.query(
                'SELECT fu_calcula_total_penalizaciones(:param1) as penalizaciones',
                {
                    replacements: { param1: credito.id },
                    type: Sequelize.QueryTypes.SELECT,
                }
            );

            //FIXME: Verificar si la fecha fin está disponible en la base rosa
            console.log(credito);

            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                fecha_inicio_real: credito.fecha_inicio_real,
                fecha_fin_prog: credito.fecha_fin_prog,
                estatus_contrato: credito.tipoEstatusContrato.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque,
                fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '',
                dias_penalizaciones: num_penalizaciones[0].penalizaciones,
                total_penalizaciones: total_penalizaciones[0].penalizaciones,
            }
        }));


        res.status(200).json({
            creditosJSON,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosLimitados = async (req, res = response) => {

    try {

        const { searchTerm } = req.query;


        const creditos = await Credito.findAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                entregado: 1,
                estatus_credito_id: {
                    [Op.ne]: 1 // Op.ne significa "no igual a"
                },
                [Op.or]: [ // Utiliza Op.or para definir la cláusula OR
                    Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                ]
            },
            limit: 25,
            order: [['id', 'ASC']]
        });

        const creditosJSON = creditos.map((credito) => {
            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                nombre: `${credito.num_contrato} | ${credito.cliente.num_cliente} | ${credito.cliente.getNombreCompleto()}`,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque
            }
        });

        console.log(creditosJSON);


        res.status(200).json({
            creditosJSON
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getCreditosLimitadosInversionPositiva = async (req, res = response) => {

    try {

        const { searchTerm } = req.query;

        const today = new Date();

        const creditos = await Credito.findAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    include: {
                        model: Agencia,
                        as: 'agencia',
                        include: {
                            model: Zona,
                            as: 'zona'
                        }
                    }
                },
                {
                    model: TipoEstatusContrato,
                    as: 'tipoEstatusContrato'
                },
                {
                    model: TipoEstatusCredito,
                    as: 'tipoEstatusCredito'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        entregado: 1,
                        inversion_positiva: {
                            [Op.not]: true // Op.not significa "no igual a true"
                        },
                        estatus_credito_id: {
                            [Op.not]: 1 // Op.not significa "no igual a 1"
                        },
                        [Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                        ]
                    },
                    Sequelize.literal(`DATE("fecha_inicio_real" + INTERVAL '1 day') = DATE(:today)`), // Compara con la fecha de inicio + 1 día
                ],
            },
            replacements: { today },
            limit: 25,
            order: [['id', 'ASC']]
        });


        const creditosJSON = creditos.map((credito) => {
            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                nombre: `${credito.num_contrato} | ${credito.cliente.num_cliente} | ${credito.cliente.getNombreCompleto()}`,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                estatus_contrato: credito.tipoEstatusContrato.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                entregado: credito.entregado,
                no_entregado: credito.no_entregado,
                num_cheque: credito.num_cheque
            }
        });

        console.log(creditosJSON);


        res.status(200).json({
            creditosJSON
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const creditosGetOptimized = async (req, res = response) => {

    try {


        const { rows } = await pool.query(queries.getCreditosOptimized);

        const cliente_id = rows[0]?.cliente_id;

        const values = [cliente_id]

        const result = await pool.query(queries.getCliente, values);

        if (result.rows[0]) {
            rows[0].cliente = result.rows[0];
        }

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

const creditoPost = async (req, res = response) => {

    try {

        delete req.body.id;

        //req.body.created_at = new Date().toISOString();

        let consulta = buildPostQueryReturningId(table, req.body);
        let resultado = {};

        const solicitud_id = req.body.solicitud_credito_id;
        const fecha_inicio = req.body.fecha_inicio_prog;

        const { rows } = await pool.query(consulta);

        if (!rows.length) throw new Error('No se pudo insertar el registro.');

        const { id, num_contrato } = rows[0];

        //Crea el balance semanal
        //const createWeeksCounter = `CALL pr_create_weeks_counter(${id}, '${fecha_inicio}')`;

        //FASE DE DESARROLLO
        const createWeeksCounter = `CALL pr_create_weeks_counter_test(${id}, '${fecha_inicio}')`;

        const changeEstatusSolicitud = `CALL pr_change_estatus_solicitud_credito(${solicitud_id})`;

        const procedimientos = [
            createWeeksCounter,
            changeEstatusSolicitud
        ]

        procedimientos.forEach(async (procedimiento) => {
            try {
                await pool.query(procedimiento);
            } catch (error) {
                console.log(error);
            }
        });

        res.status(200).json(
            {
                id,
                msg: `El crédito ${num_contrato} ha sido añadido correctamente.`
            }
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

const creditoPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        delete req.body.id;
        delete req.body.monto_semanal;
        delete req.body.num_contrato;
        delete req.body.adeudo_restante;
        delete req.body.total_pagado;
        delete req.body.total_recargos;
        delete req.body.total_adeudo;

        const consulta = buildPatchQuery(id, table, req.body);

        //BEFORE update Solicitud
        await pool.query(`CALL pr_change_estatus_solicitud_credito_before(${id})`);

        const result = await pool.query(consulta);

        //AFTER update Solicitud
        await pool.query(`CALL pr_change_estatus_solicitud_credito_after(${id})`);

        //Solo si creamos inversion positiva
        if (req.body?.inversion_positiva) {
            //CALL ...
        }

        //Si quitamos inversion positiva
        if (!req.body.inversion_positiva) {
            console.log('inversion negativa');
        }

        res.status(200).json(
            `El crédito: ${result.rows[0]['num_contrato']} ha sido modificado correctamente.`
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

const creditoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        await pool.query(`DELETE FROM dbo.balance_semanal WHERE credito_id = $1`, values)
        const result = await pool.query(queries.deleteCredito, values);

        if (!result.rows.length) throw new Error('No se pudo eliminar el registro.');

        res.status(200).json(
            `El crédito: ${result.rows[0]['num_contrato']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const creditoGetByCriteria = async (req, res = response) => {

    console.log('entramos al criteria');

    const { criterio, palabra } = req.params;

    try {

        let sql = '';
        let cadena_aux = palabra.toUpperCase();

        let select_query = queries.getCreditoQueryGenerica;

        let clausula_where = '';
        let order_by = 'ORDER BY a.id'

        switch (criterio) {

            case 'estatus_id':

                clausula_where = `WHERE g.id = ${cadena_aux}`;

                break;

            case 'nombre':

                clausula_where = `WHERE c.nombre like  '%${cadena_aux}%' `;

                break;

            case 'apellido_paterno':

                clausula_where = `WHERE c.apellido_paterno like  '%${cadena_aux}%' `;

                break;

            case 'apellido_materno':

                clausula_where = `WHERE c.apellido_materno like  '%${cadena_aux}%' `;

                break;

            case 'num_contrato':

                clausula_where = `WHERE a.num_contrato = ${palabra} `;

                break;

            case 'fecha_inicio_prog':
                clausula_where = `WHERE a.fecha_inicio_prog = '${palabra}' `;
                break;

        }

        sql = `${select_query} ${clausula_where}
                ${order_by}`;

        console.log(sql);


        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const setFechaCreditosMasivos = async (req, res = response) => {

    try {

        const creditos = req.body;
        const nullValue = null;

        const creditosConFechaEntrega = creditos.filter(credito => credito['fecha_entrega']);

        for (const { credito_id, fecha_entrega, hora_entrega, fecha_inicio,
            num_cheque, entregado, no_entregado, motivo, num_semanas } of creditosConFechaEntrega) {

            const fechaInicioAux = fecha_inicio ? `'${fecha_inicio}'` : nullValue;
            const numChequeAux = num_cheque ? Number(num_cheque) : nullValue;
            const entregadoAux = entregado ? entregado : nullValue;
            const noEntregadoAux = no_entregado ? no_entregado : nullValue;
            const motivoAux = motivo ? `'${motivo}'` : nullValue;

            if (!hora_entrega) {
                return res.status(500).json('Hora de entrega no valida');
            }

            const procedimiento = `CALL pr_set_fecha_entrega_credito_preaprobado( 
                ${credito_id}, '${fecha_entrega}', '${hora_entrega}',
                ${fechaInicioAux},${numChequeAux},
                ${entregadoAux},${noEntregadoAux},
                ${motivoAux},${num_semanas} 
            )`;

            await pool.query(procedimiento);

        }


        res.status(200).json(
            `Crédito(s) modificado(s) con éxito`
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const printContratosMasivos = async (req, res = response) => {
    try {

        const creditosLista = req.body;

        const creditos = creditosLista.filter(credito => credito['printSelected']);

        // Configuración de Puppeteer
        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();
        const page2 = await browser.newPage();

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_documentation.hbs', 'utf-8');
        //Plantilla de la amortizacion
        const template2 = fs.readFileSync('./views/template_tarjeta_pagos.hbs', 'utf-8');

        //Helpers Menor que
        handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 < v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Mayor que
        handlebars.registerHelper('ifCondMayor', function (v1, v2, options) {
            if (v1 > v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Helpers Igual que
        handlebars.registerHelper('ifEqualsTo', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //n veces
        handlebars.registerHelper('times', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

        const DOC = handlebars.compile(template);
        const DOC2 = handlebars.compile(template2);

        const outputDirectory = path.resolve(__dirname, '..', 'pdfs');
        fs.mkdirSync(outputDirectory, { recursive: true }); // se crea el directorio si no existe

        const pdfsToMerge = [];

        for (const { credito_id } of creditos) {
            const values = [credito_id];

            const { rows } = await pool.query(queries.queryPrintContrato, values);

            // Consulta amortizacion
            const result = await pool.query(queries.queryPrintAmorti, values);

            const resultado = await pool.query(queries.getCredito, values);

            //dif_num_semanas es la diferencia entre el numero de semanas y el maximo numero de semanas
            // que pueden aparecer en la tarjeta de pagos.
            //esto se establece en la query GetCredito.

            const { num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
                num_semanas, dif_num_semanas,
                nombre, apellido_paterno, apellido_materno, monto_total_letras,
                telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
                fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2 } = resultado.rows[0];

            console.log(dif_num_semanas);
            console.log('num_semanas:', num_semanas);

            result['contrato'] = {
                rows
            }

            result['credito'] = {
                num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
                monto_semanal,
                num_semanas, dif_num_semanas,
                fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
                nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
                zona, agencia
            };


            // Rellenamos la plantilla con los datos de cada crédito
            const html = DOC({ ...result, credito_id });

            const html2 = DOC2(result);

            // Generamos el PDF
            await page.setContent(html, { waitUntil: 'networkidle0' });

            await page2.setContent(html2, { waitUntil: 'networkidle0' });

            const pdf = await page.pdf({
                format: 'Letter',
                margin: {
                    top: '1cm',
                    bottom: '1cm'
                },
                printBackground: true,
            });

            const pdf2 = await page2.pdf({
                format: 'Letter',
                landscape: true,
                margin: {
                    top: '1cm',
                    bottom: '1cm'
                },
                printBackground: true,
            });

            // Guardamos el PDF generado en el servidor
            const filename = `credito_${credito_id}.pdf`;
            fs.writeFileSync(`${outputDirectory}/${filename}`, pdf);

            const filename2 = `amortizacion_${credito_id}.pdf`;
            fs.writeFileSync(`${outputDirectory}/${filename2}`, pdf2);

            const pdfBuffer = fs.readFileSync(`${outputDirectory}/${filename}`);
            const pdfBuffer2 = fs.readFileSync(`${outputDirectory}/${filename2}`);

            pdfsToMerge.push(pdfBuffer);
            pdfsToMerge.push(pdfBuffer2);
        }

        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfsToMerge) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const buf = await mergedPdf.save(); // Uint8Array






        await browser.close();

        const buffer = Buffer.from(buf);

        let namePDF = "contratos";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `attachment; filename="${namePDF}.pdf"`);

        res.send(buffer);

        // Borramos los archivos generados del servidor
        for (const { credito_id } of creditos) {
            const filename = `credito_${credito_id}.pdf`;
            const filename2 = `amortizacion_${credito_id}.pdf`;

            fs.unlinkSync(`${outputDirectory}/${filename}`);
            fs.unlinkSync(`${outputDirectory}/${filename2}`);
        }

    } catch (error) {

        console.log(error);

        res.status(500).send('Ocurrió un error al generar el archivo PDF.');
    }
}

const amortizacionGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getAmortizacion, values);

        //necesitamos saber datos generales del credito, tarifa num de semanas, monto semanal y monto total.
        const resultado = await generateAmortizacion(rows);

        res.status(200).json(
            resultado
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const amortizacionPost = async (req, res = response) => {

    try {

        //Aqui tengo pendiente el ver como se envia el req.body ya que se realizaron algunos cambios al generateAmortizacion sobretodo por el [0]
        const resultado = await generateAmortizacion(req.body);

        res.status(200).json(
            resultado
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const printContrato = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_contrato.hbs', 'utf-8');

        const { rows } = await pool.query(queries.queryPrintContrato, values);

        const DOC = handlebars.compile(template);

        //Aqui pasamos data al template hbs
        const html = DOC(rows[0]);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            margin: {
                top: '1cm',
                bottom: '1cm'
            },
            printBackground: true,
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        const bufferStream = new Stream.PassThrough();

        let namePDF = "contrato_";
        res.setHeader('Content-disposition', "inline; filename*=UTF-8''" + namePDF + ".pdf");
        res.setHeader('Content-type', 'application/pdf');

        bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printAmortizacion = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_amortizacion.hbs', 'utf-8');

        const result = await pool.query(queries.queryPrintAmorti, values);
        const resultado = await pool.query(queries.getCredito, values);

        const DOC = handlebars.compile(template);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, monto_otorgado, monto_otorgado2, monto_semanal, nombre,
            apellido_paterno, apellido_materno, fecha_inicio_prog } = resultado.rows[0];


        result['credito'] = {
            num_contrato, monto_otorgado,
            monto_otorgado2,
            monto_semanal, fecha_inicio_prog,
            nombre, apellido_paterno, apellido_materno
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            margin: {
                top: '1cm',
                bottom: '1cm'
            },
            //landscape: true,
            printBackground: true
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        //const bufferStream = new Stream.PassThrough();

        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printTarjetaPagos = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_pagare.hbs', 'utf-8');

        const result = await pool.query(queries.queryPrintAmorti, values);
        const resultado = await pool.query(queries.getCredito, values);

        handlebars.registerHelper('times', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

        const DOC = handlebars.compile(template);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
            nombre, apellido_paterno, apellido_materno, monto_total_letras,
            telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
            fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2 } = resultado.rows[0];


        console.log(resultado.rows[0]);
        //console.log(result.rows);


        result['credito'] = {
            num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
            monto_semanal, fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
            nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
            zona, agencia
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            margin: {
                top: '1cm',
                bottom: '1cm',
            },
            format: 'letter',
            //landscape: true,
            printBackground: true
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        //const bufferStream = new Stream.PassThrough();

        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printCreditos = async (req, res = response) => {

    try {

        const { fecha_inicio } = req.body;

        const template = fs.readFileSync('./views/template_lista_creditos.hbs', 'utf-8');

        let consultaSql = queries.getCreditosGenerica;
        let clausulaWhere = `WHERE a.fecha_inicio_prog = '${fecha_inicio}' `;
        let clausulaOrder = `ORDER BY a.id`;

        if (fecha_inicio) {
            consultaSql = consultaSql + clausulaWhere + clausulaOrder
        } else {
            consultaSql = queries.getCreditos;
        }

        const resultado = await pool.query(consultaSql);

        //Helpers
        handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        const DOC = handlebars.compile(template);

        const html = DOC(resultado);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();
        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);

        await page.setContent(html);

        const pdf = await page.pdf({
            margin: {
                top: '1cm',
                bottom: '1cm',
                left: '1cm',
                right: '1cm'
            },
            format: 'letter',
            //landscape: true,
            printBackground: true
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        //const bufferStream = new Stream.PassThrough();

        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printReporteCartas = async (req, res = response) => {


    const { semana_id } = req.params;

    const values = [semana_id];

    //Iniciamos leyendo la plantilla del contrato
    const template = fs.readFileSync('./views/template_reporte_cartas.hbs', 'utf-8');


    // const creditos = await Credito.findAll({
    //     include: [
    //         {
    //             model: Cliente,
    //             as: 'cliente',
    //             include: {
    //                 model: Agencia,
    //                 as: 'agencia',
    //                 include: {
    //                     model: Zona,
    //                     as: 'zona'
    //                 }
    //             }
    //         },
    //         {
    //             model: Tarifa,
    //             as: 'tarifa'
    //         },
    //         {
    //             model: TipoEstatusCredito,
    //             as: 'tipoEstatusCredito'
    //         }
    //     ],
    //     where: {
    //         estatus_credito_id: {
    //             [Op.not]: [1]
    //         }
    //     },
    //     order: [
    //         [Sequelize.literal('"cliente.agencia.zona.nombre"'), 'ASC'],
    //         [Sequelize.literal('"cliente.agencia.nombre"'), 'ASC']
    //     ],
    //     limit: 200
    // });

    const { rows } = await pool.query(queries.getReporteCartasOptimizado, values);

    const creditosJSON = await Promise.all(rows.map(async (credito) => {

        //TODO: Validar si existe num_contrato_historico

        const ultimoPago = await Pago.findOne({
            where: {
                credito_id: credito.id,
                monto: {
                    [Op.gte]: credito.monto_semanal,
                },
            },
            order: [['fecha', 'DESC']],
            limit: 1
        });

        const semanaReporte = await Semana.findOne({
            where: {
                id: semana_id
            }
        })

        let fechaOriginal = '';
        let fechaFormateada = '';

        let semanaAtraso = 0;
        let clasificacion = '';



        if (ultimoPago) {

            //Este fue el ultimo pago, pero debo de saber si fue completo

            fechaOriginal = ultimoPago.fecha;
            const ultimaSemanaPago = ultimoPago.weekyear

            semanaAtraso = semanaReporte.weekyear - ultimaSemanaPago;

            const partesFecha = fechaOriginal.split('-'); // Dividimos la fecha en año, mes y día
            fechaFormateada = `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}`;



        } else {
            fechaFormateada = '';

            //Calculo la primer semana del credito

            const primerSemanaCredito = await Semana.findOne({
                where: {
                    fecha_inicio: {
                        [Op.lte]: credito.fecha_inicio_real
                    },
                    fecha_fin: {
                        [Op.gte]: credito.fecha_inicio_real
                    }
                }
            });

            semanaAtraso = semanaReporte.weekyear - primerSemanaCredito.weekyear;

        }

        if (semanaAtraso < 0) {
            clasificacion = 'Visita/Llamada';
        } else if (semanaAtraso > 14) {
            clasificacion = 'Extrajudicial';
        } else {

            let clasificaciones = {
                0: 'Visita/Llamada',
                1: 'Carta N-1',
                2: 'Carta N-1',
                3: 'Carta N-1',
                4: 'Carta N-2',
                5: 'Carta N-2',
                6: 'Carta N-2',
                7: 'Carta N-2',
                8: 'Carta N-3',
                9: 'Carta N-3',
                10: 'Carta N-3',
                11: 'Carta N-3',
                12: 'Incumplimiento',
                13: 'Incumplimiento',
                14: 'Extrajudicial'
            };

            clasificacion = clasificaciones[semanaAtraso] || 'Otro';

        }

        //Aqui podriamos ejecutar los metodos para calcular el total para liquidar, el total_pago y el total de las penalizaciones

        const total_pagado = await Pago.sum('monto',{
            where: {
                credito_id: credito.id,
                cancelado: null
            }
        });

        //Aqui 

        const grand_total = await devuelve_grand_total(credito);

        return {
            num_contrato: credito.num_contrato,
            zona: credito.zona,
            agencia: credito.agencia,
            nombre: credito.nombre_completo,
            fecha_fin_prog: credito.fecha_fin_prog,
            fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '-',
            monto_otorgado: credito.monto_otorgado,
            monto_semanal: credito.monto_semanal,
            semanas_atraso: semanaAtraso ? semanaAtraso : '',
            estatus: credito.estatus,
            //total_pagado: credito.total_pagado,
            total_pagado,
            total_penalizaciones: credito.total_penalizaciones,
            monto_total: credito.monto_total,
            total_liquidar: credito.total_liquidar,
            accion_correspondiente: clasificacion,
            total_liquidar: grand_total
        }

    }));

    //console.log(creditosJSON);

    // const creditosJSON = rows.map((credito) => {

    //     //TODO: Validar si existe num_contrato_historico

    //     return {
    //         credito_id: credito.id,
    //         num_contrato: credito.num_contrato,
    //         zona: credito.cliente.agencia.zona.nombre,
    //         agencia: credito.cliente.agencia.nombre,
    //         nombre: credito.cliente.getNombreCompleto(),
    //         monto_otorgado: credito.monto_otorgado,
    //         monto_semanal: ( credito.monto_total / credito.tarifa.num_semanas).toFixed(2),
    //         estatus: credito.tipoEstatusCredito.nombre
    //     }

    // });

    const DOC = handlebars.compile(template);


    //Aqui pasamos data al template hbs
    const html = DOC({ creditosJSON });

    const browser = await puppeteer.launch({
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    // Configurar el tiempo de espera de la navegación
    await page.setDefaultNavigationTimeout(50000);
    await page.setContent(html);

    try {

        const pdf = await page.pdf({
            format: 'letter',
            landscape: true,
            margin: {
                top: '1cm',
                bottom: '1cm',
                left: '1cm',
                right: '1cm'
            },
            printBackground: true,
        });

        await browser.close();

        const buffer = Buffer.from(pdf);

        let namePDF = "contrato_";
        res.setHeader('Content-disposition', "inline; filename*=UTF-8''" + namePDF + ".pdf");
        res.setHeader('Content-type', 'application/pdf');

        return res.send(buffer);

    } catch (pdfError) {

        console.log('Error al generar el PDF:', pdfError);
        await browser.close();

        res.status(500).json({
            error: 'Error al generar el PDF'
        });
    }

}

const printAllDoc = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        // Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_documentation.hbs', 'utf-8');
        const template2 = fs.readFileSync('./views/template_tarjeta_pagos.hbs', 'utf-8');

        //Helpers Menor que
        handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 < v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Mayor que
        handlebars.registerHelper('ifCondMayor', function (v1, v2, options) {
            if (v1 > v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Helpers Igual que
        handlebars.registerHelper('ifEqualsTo', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //n veces
        handlebars.registerHelper('times', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

        // Obtenemos la consulta del contrato
        const { rows } = await pool.query(queries.queryPrintContrato, values);

        // Consulta amortización
        const result = await pool.query(queries.queryPrintAmorti, values);

        // Consulta encabezado amortizacion
        const resultado = await pool.query(queries.getCredito, values);

        const DOC = handlebars.compile(template);
        const DOC2 = handlebars.compile(template2);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
            nombre, apellido_paterno, apellido_materno, monto_total_letras,
            telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
            fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2 } = resultado.rows[0];

        result['contrato'] = {
            rows
        }


        result['credito'] = {
            num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
            monto_semanal, fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
            nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
            zona, agencia
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);
        const html2 = DOC2(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        //Configuramos las paginas
        const page = await browser.newPage();
        const page2 = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);

        await page.setContent(html);
        await page2.setContent(html2);

        // await page.addStyleTag(
        //     { content: '.page{background-color:red}' },
        // );
        await page.addStyleTag(
            { content: '.page{height:975px}' },
        );
        await page.addStyleTag(
            { content: '@page {size: 8.5in 11in; margin-top: 40px; margin-bottom: 40px}' }
        );
        await page2.addStyleTag(
            { content: '.page{height:975px}' },
        );
        await page2.addStyleTag(
            { content: '@page {size: 8.5in 11in; margin-top: 40px; margin-bottom: 40px}' }
        );


        //TODO: Aqui podemos dejar pendiente el que no se guarde e el disco local los archivos sino en archivos temporales
        await page.pdf({ path: './page1.pdf' });
        await page2.pdf({ path: './page2.pdf' });

        var pdfBuffer1 = fs.readFileSync("./page1.pdf");
        var pdfBuffer2 = fs.readFileSync("./page2.pdf");

        var pdfsToMerge = [pdfBuffer1, pdfBuffer2]

        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfsToMerge) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const buf = await mergedPdf.save();        // Uint8Array

        await browser.close();

        const buffer = Buffer.from(buf);


        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printEntregasCredito = async (req, res = response) => {


    try {

        const { fecha_entrega_prog } = req.body;

        const values = [fecha_entrega_prog];

        console.log(fecha_entrega_prog);

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_entrega_creditos.hbs', 'utf-8');

        //obtenemos la consult del contrato
        const result = await pool.query(queries.getCreditosPreaprobados, values);

        const resultado = await pool.query(`
            SELECT '${fecha_entrega_prog}' as fecha_entrega_programada,
            TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','CN'),'999,999D99')) as monto_cn,
            TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','R'),'999,999D99')) as monto_r,
            fu_get_count_cn_r('${fecha_entrega_prog}') as count_cn_r,
            fu_get_count_cn('${fecha_entrega_prog}','CN') as count_cn,
            fu_get_count_r('${fecha_entrega_prog}','R') as count_r,
            TRIM(TO_CHAR(fu_get_monto_total_creditos_preaprobados($1),'999,999D99')) as monto_total_creditos`, values);

        //Helpers
        handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        const DOC = handlebars.compile(template);

        console.log(result.rows[0]);

        const {
            fecha_entrega_programada,
            hora_entrega,
            monto_total_creditos,
            monto_cn, monto_r,
            count_cn_r,
            count_cn, count_r
        } = resultado.rows[0];

        result['creditos'] = {
            fecha_entrega_programada,
            hora_entrega,
            monto_total_creditos,
            monto_cn, monto_r,
            count_cn_r,
            count_cn, count_r
        };

        console.log(resultado.rows[0]);

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        //Configuramos las paginas
        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            landscape: true,
            margin: {
                bottom: '1cm',
                left: '1cm',
                right: '1cm'
            },
            printBackground: true
        })


        await browser.close();

        const buffer = Buffer.from(pdf);

        let namePDF = "entregaCreditos";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const inversionPositivaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        //BEFORE update Solicitud
        await pool.query(`UPDATE dbo.creditos SET inversion_positiva = false WHERE id = ${id}`);


        res.status(200).json(
            `La inversion positiva ha sido eliminada correctamente.`
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
    creditoGet,
    creditosGet,
    creditosGetOptimized,
    getCreditoOptimizado,
    getCreditosPaginados,
    getCreditosLimitados,
    getCreditosLimitadosInversionPositiva,
    getCreditosByClienteId,
    getCreditosInversionPositivaPaginados,
    getCreditosProgramacionEntregaPaginados,
    creditoPost,
    creditoPut,
    creditoDelete,
    setFechaCreditosMasivos,
    printContratosMasivos,
    amortizacionGet,
    amortizacionPost,
    printContrato,
    printCreditos,
    printAmortizacion,
    printTarjetaPagos,
    printAllDoc,
    printEntregasCredito,
    inversionPositivaDelete,
    creditoGetByCriteria,
    creditosGetTotal,
    printReporteCartas
} 