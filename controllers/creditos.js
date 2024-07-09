const { response } = require('express');
const pool = require('../database/connection');
const ExcelJS = require('exceljs');

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
const { generateAmortizacionOptimizada } = require('../helpers/calculateAmorticacionOptimized');
const BalanceSemanal = require('../models/balance_semanal');
const { generateNewAmortization } = require('../helpers/newAmortization');




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
            credito.tarifa_id = credito.tarifa_id
            credito.tipoCredito = credito.tipoCredito
            credito.monto_semanal = credito.tarifa.monto_semanal
            credito.cliente.dataValues.nombre_completo = `${credito.cliente.nombre} ${credito.cliente.apellido_paterno} ${credito.cliente.apellido_materno}`
        }


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
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`"num_contrato"::TEXT LIKE '%${searchTerm}%'`),
                    Sequelize.literal(`"num_contrato_historico"::TEXT LIKE '%${searchTerm}%'`),
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
                monto_otorgado: credito.tarifa.monto,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito?.nombre,
                estatus_credito_id: credito.tipoEstatusCredito?.id,
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

        console.log(rows);

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const creditosJSON = rows.map((credito) => {
            return {
                id: credito.id,
                solicitud_credito_id: credito.solicitud_credito_id,
                solicitudCredito: credito.solicitudCredito,
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

        console.log('entramos al controller');

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

            return {
                id: credito.id,
                num_contrato: credito.num_contrato,
                nombre_completo: credito.cliente.getNombreCompleto(),
                zona: credito.cliente.agencia.zona.nombre,
                agencia: credito.cliente.agencia.nombre,
                monto_otorgado: credito.monto_otorgado,
                fecha_inicio_real: credito.fecha_inicio_real,
                fecha_fin_prog: credito.fecha_fin_prog,
                estatus_contrato: credito.tipoEstatusContrato?.nombre,
                estatus_credito: credito.tipoEstatusCredito.nombre,
                estatus_credito_id: credito.tipoEstatusCredito.id,
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

        console.log('se entra a la documentation');

        const creditosLista = req.body;

        const creditos = creditosLista.filter(credito => credito['printSelected']);

        const creditos_personal = creditos.filter(credito => credito['tipo_credito'] != '2');
        const creditos_micronegocio = creditos.filter(credito => credito['tipo_credito'] == '2');


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

        //Plantilla contratos MICRONEGOCIO
        const template3 = fs.readFileSync('./views/template_documentation_MICRO.hbs', 'utf-8');

        //Plantilla de la amortizacion MICRONEGOCIO
        const template4 = fs.readFileSync('./views/template_tarjeta_pagos_MICRO.hbs', 'utf-8');

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
        const DOC3 = handlebars.compile(template3);
        const DOC4 = handlebars.compile(template4);

        const outputDirectory = path.resolve(__dirname, '..', 'pdfs');
        fs.mkdirSync(outputDirectory, { recursive: true }); // se crea el directorio si no existe

        const pdfsToMerge = [];

        //Imprimimos los contratos PERSONALES

        for (const { credito_id } of creditos_personal) {
            const values = [credito_id];

            const { rows } = await pool.query(queries.queryPrintContrato, values);

            // Consulta amortizacion
            const result = await pool.query(queries.queryPrintAmorti, values);

            const resultado = await pool.query(queries.getCredito, values);

            //dif_num_semanas es la diferencia entre el numero de semanas y el maximo numero de semanas
            // que pueden aparecer en la tarjeta de pagos.
            //esto se establece en la query GetCredito.

            const {
                num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
                num_semanas, dif_num_semanas,
                nombre, apellido_paterno, apellido_materno, monto_total_letras,
                telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
                fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2, fecha_fin_prog_proyecta,
                dia_fecha_fin_prog_proyecta,
                mes_fecha_fin_prog_proyecta,
                anio_fecha_fin_prog_proyecta
            } = resultado.rows[0];

            result['contrato'] = {
                rows
            }

            console.log(fecha_fin_prog_proyecta);

            result['credito'] = {
                num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
                monto_semanal,
                num_semanas, dif_num_semanas,
                fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
                fecha_fin_prog_proyecta,
                dia_fecha_fin_prog_proyecta,
                mes_fecha_fin_prog_proyecta,
                anio_fecha_fin_prog_proyecta,
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

        //Procedemos a imprimir los contratos de MICRONEGOCIO

        for (const { credito_id } of creditos_micronegocio) {
            const values = [credito_id];

            const { rows } = await pool.query(queries.queryPrintContratoMICRONEGOCIO, values);

            // Consulta amortizacion
            const result = await pool.query(queries.queryPrintAmorti, values);

            const resultado = await pool.query(queries.getCreditoMICRONEGOCIO, values);

            //dif_num_semanas es la diferencia entre el numero de semanas y el maximo numero de semanas
            // que pueden aparecer en la tarjeta de pagos.
            //esto se establece en la query GetCredito.

            const {
                num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
                num_semanas, dif_num_semanas,
                nombre, apellido_paterno, apellido_materno,
                aval_nombre, aval_apellido_paterno, aval_apellido_materno, aval_telefono,
                aval_calle, aval_num_ext, aval_colonia,
                monto_total_letras,
                telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
                fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
                fecha_fin_prog_proyecta,
                dia_fecha_fin_prog_proyecta,
                mes_fecha_fin_prog_proyecta,
                anio_fecha_fin_prog_proyecta
            } = resultado.rows[0];

            result['contrato'] = {
                rows
            }

            result['credito'] = {
                num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
                monto_semanal,
                num_semanas, dif_num_semanas,
                fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
                fecha_fin_prog_proyecta,
                dia_fecha_fin_prog_proyecta,
                mes_fecha_fin_prog_proyecta,
                anio_fecha_fin_prog_proyecta,
                nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
                aval_nombre, aval_apellido_paterno, aval_apellido_materno, aval_telefono,
                aval_calle, aval_num_ext, aval_colonia,
                zona, agencia
            };

            console.log(dia_fecha_fin_prog_proyecta);
            console.log(fecha_fin_prog_proyecta);


            // Rellenamos la plantilla con los datos de cada crédito
            const html = DOC3({ ...result, credito_id });

            const html2 = DOC4(result);

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

        console.log('este sel buenasw');
        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getAmortizacion, values);

        //necesitamos saber datos generales del credito, tarifa num de semanas, monto semanal y monto total.

        //VERSION 1
        //const resultado = await generateAmortizacion(rows);

        //VERSION 2
        //const resultado = await generateAmortizacionOptimizada(rows);

        //VERSION 3
        const resultado = await generateNewAmortization(rows);

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
        //const resultado = await generateAmortizacionOptimizada(req.body);

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

    const { id, zona_id, agencia_id } = req.body;

    //const values = [id];

    //Iniciamos leyendo la plantilla del contrato
    const template = fs.readFileSync('./views/template_reporte_cartas.hbs', 'utf-8');

    //const { rows } = await pool.query(queries.getReporteCartasUNION, values);
    const [rows] = await Credito.devuelveRegistrosReporteCartas(id, zona_id, agencia_id);

    const semanaReporte = await Semana.findOne({
        where: {
            id: id
        }
    });

    const fechaInicioSemanaReporte = new Date(semanaReporte.fecha_inicio);

    const creditosJSON = await Promise.all(rows.map(async (credito) => {

        const ultimoPago = await Pago.findOne({
            where: {
                credito_id: credito.credito_id,
            },
            order: [['fecha', 'DESC']]
        });

        let fechaOriginal = '';
        let fechaFormateada = '';

        let semanaAtraso = 0;
        let clasificacion = '';

        let diffDias;


        if (ultimoPago) {

            // Obtenemos la fecha del último pago y la convertimos a un objeto Date
            const fechaUltimoPago = new Date(ultimoPago.fecha);

            // Restamos la fecha del último pago a la fecha_fin de la semana del reporte
            const diffTiempo = fechaInicioSemanaReporte.getTime() - fechaUltimoPago.getTime();

            // Convertimos la diferencia de tiempo a días
            diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            fechaOriginal = ultimoPago.fecha;

            //semanaAtraso = Math.ceil(diffDias / 7);
            semanaAtraso = Math.round(diffDias / 7);


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

            //Debemos de ver los casos cuando apenas empezaran a pagar

            const fecha_inicio_real = new Date(credito.fecha_inicio_real);
            fecha_inicio_real.setUTCHours(fecha_inicio_real.getUTCHours() - 6);

            if (fecha_inicio_real.getTime() === new Date(fechaInicioSemanaReporte).getTime()) {
                semanaAtraso = 0;
            }

        }

        if (semanaAtraso < 0) {
            clasificacion = 'Visita/Llamada';
        } else if (semanaAtraso > 14) {
            clasificacion = 'Extrajudicial';
        } else {

            let clasificaciones = {
                0: 'Visita/Llamada',
                1: 'Visita/Llamada',
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


        let total_liquidar = 0;

        const num_dias_penalizaciones = await BalanceSemanal.sum('num_dias_penalizacion_semanal', {
            where: {
                credito_id: credito.credito_id,
                fecha_inicio: {
                    [Sequelize.Op.lt]: fechaInicioSemanaReporte
                }
            }
        });

        let monto_total_penalizaciones = Number(num_dias_penalizaciones) * (Number(credito.monto_otorgado) * 0.010);

        total_liquidar = ((credito.monto_total) - (credito.monto_total_pagado)) + Number(monto_total_penalizaciones);

        total_liquidar = Number(total_liquidar).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // console.log(`Credito_id: ${credito.credito_id}`);
        // console.log(`Total a liquidar: ${total_liquidar}`);
        // console.log(`Monto total de penalizaciones: ${monto_total_penalizaciones}`);
        // console.log('PENALIZACIONES;', num_dias_penalizaciones);

        const fechaFinProgramadoContrato = new Date(credito.fecha_fin_prog2);

        // console.log('FEcha fin contrato', credito.fecha_fin_prog);
        // console.log('Fecha Fin Contrato Date', fechaFinProgramadoContrato);
        // console.log('Fecha Inicio Semana', fechaInicioSemanaReporte);
        // console.log('Semanas de Atraso', semanaAtraso);


        return {
            num_contrato: credito.num_contrato,
            num_contrato_historico: credito.num_contrato_historico,
            zona: credito.zona,
            agencia: credito.agencia,
            nombre: credito.nombre_completo,
            fecha_fin_prog: credito.fecha_fin_prog,
            fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '-',
            monto_otorgado: credito.monto_otorgado,
            monto_semanal: credito.monto_semanal,
            semanas_atraso: semanaAtraso != null ? semanaAtraso : '',
            estatus: fechaFinProgramadoContrato < fechaInicioSemanaReporte ? 'Vencido' : 'Vigente',
            total_pagado: credito.monto_total_pagado,
            total_liquidar: total_liquidar,
            total_penalizaciones: credito.total_penalizaciones,
            monto_total: credito.monto_total,
            accion_correspondiente: clasificacion,
        }

    }));

    const cantidadRegistros = creditosJSON.length;


    const DOC = handlebars.compile(template);

    //Aqui pasamos data al template hbs
    const html = DOC({ creditosJSON, cantidadRegistros });

    const browser = await puppeteer.launch({
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(200000);
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

const printReporteCartasXLS = async (req, res, next) => {

    try {
        const { id, zona_id, agencia_id } = req.body;

        const [rows] = await Credito.devuelveRegistrosReporteCartas(id, zona_id, agencia_id);

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte Cartas');

        // Definir encabezados de las columnas y el tipo de datos
        worksheet.columns = [
            { header: 'Zona', key: 'zona', style: { numFmt: '0' } },
            { header: 'Agencia', key: 'agencia' },
            { header: 'Número de Contrato', key: 'num_contrato', width: 20 }, // Formato de número sin decimales
            { header: 'Número de Contrato Histórico', key: 'num_contrato_historico', width: 30 },
            { header: 'Nombre', key: 'nombre', width: 60 },
            { header: 'Tarifa Semanal', key: 'monto_semanal', width: 15, },
            { header: 'Adeudo para liquidar', key: 'total_liquidar', width: 20, },
            { header: 'Fecha Final de Contrato', key: 'fecha_fin_prog', width: 20, },
            { header: 'Último Pago', key: 'fecha_ultimo_pago', width: 20, },
            { header: 'Semanas de Atraso', key: 'semanas_atraso' },
            { header: 'Estatus', key: 'estatus' },
            { header: 'Acción Correspondiente', key: 'accion_correspondiente', width: 20 },
        ];

        const semanaReporte = await Semana.findOne({
            where: {
                id: id
            }
        });

        const fechaInicioSemanaReporte = new Date(semanaReporte.fecha_inicio);

        // Iterar sobre los créditos y calcular las acciones correspondientes
        await Promise.all(rows.map(async (credito) => {

            const ultimoPago = await Pago.findOne({
                where: {
                    credito_id: credito.credito_id,
                },
                order: [['fecha', 'DESC']]
            });

            let fechaOriginal = '';
            let fechaFormateada = '';

            let semanaAtraso = 0;
            let clasificacion = '';

            let diffDias;

            if (ultimoPago) {

                // Obtenemos la fecha del último pago y la convertimos a un objeto Date
                const fechaUltimoPago = new Date(ultimoPago.fecha);

                // Restamos la fecha del último pago a la fecha_fin de la semana del reporte
                const diffTiempo = fechaInicioSemanaReporte.getTime() - fechaUltimoPago.getTime();

                // Convertimos la diferencia de tiempo a días
                diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

                fechaOriginal = ultimoPago.fecha;

                //semanaAtraso = Math.ceil(diffDias / 7);
                semanaAtraso = Math.round(diffDias / 7);


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

                if (primerSemanaCredito) {
                    semanaAtraso = semanaReporte.weekyear - primerSemanaCredito.weekyear;

                    //Debemos de ver los casos cuando apenas empezaran a pagar

                    const fecha_inicio_real = new Date(credito.fecha_inicio_real);
                    fecha_inicio_real.setUTCHours(fecha_inicio_real.getUTCHours() - 6);

                    if (fecha_inicio_real.getTime() === new Date(fechaInicioSemanaReporte).getTime()) {
                        semanaAtraso = 0;
                    }
                } else {
                    semanaAtraso = 0;
                }

            }

            if (semanaAtraso < 0) {
                clasificacion = 'Visita/Llamada';
            } else if (semanaAtraso > 14) {
                clasificacion = 'Extrajudicial';
            } else {

                let clasificaciones = {
                    0: 'Visita/Llamada',
                    1: 'Visita/Llamada',
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

            let total_liquidar = 0;

            const num_dias_penalizaciones = await BalanceSemanal.sum('num_dias_penalizacion_semanal', {
                where: {
                    credito_id: credito.credito_id,
                    fecha_inicio: {
                        [Sequelize.Op.lt]: semanaReporte.fecha_inicio
                    }
                }
            });

            let monto_total_penalizaciones = Number(num_dias_penalizaciones) * (Number(credito.monto_otorgado) * 0.010);

            total_liquidar = parseFloat((credito.monto_total) - (credito.monto_total_pagado)) + Number(monto_total_penalizaciones);

            let monto_semanal = parseFloat(credito.monto_semanal)


            //total_liquidar = Number(total_liquidar).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            const fechaFinProgramadoContrato = new Date(credito.fecha_fin_prog2);

            // Agregar fila al worksheet
            worksheet.addRow({
                num_contrato: credito.num_contrato,
                num_contrato_historico: credito.num_contrato_historico,
                zona: parseInt(credito.zona),
                agencia: parseInt(credito.agencia),
                nombre: credito.nombre_completo,
                fecha_fin_prog: credito.fecha_fin_prog,
                fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '-',
                monto_otorgado: credito.monto_otorgado,
                monto_semanal: monto_semanal,
                semanas_atraso: semanaAtraso != null ? semanaAtraso : '',
                estatus: fechaFinProgramadoContrato < fechaInicioSemanaReporte ? 'Vencido' : 'Vigente',
                total_pagado: credito.monto_total_pagado,
                total_liquidar: total_liquidar,
                total_penalizaciones: credito.total_penalizaciones,
                monto_total: credito.monto_total,
                accion_correspondiente: clasificacion,
            });

            const styleColumns = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DDDDDD' }
            }

            //Pintamos de color gris unicamente el row 1
            const row1 = worksheet.getRow(1);
            row1.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = styleColumns
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'L1',
            };

            const lastRow = worksheet.lastRow;

            const cell_monto_semanal = lastRow.getCell('F');
            cell_monto_semanal.type = ExcelJS.ValueType.Number;
            cell_monto_semanal.numFmt = '0.00';
            cell_monto_semanal.alignment = { horizontal: 'right' };

            const cell_total_liquidar = lastRow.getCell('G');
            cell_total_liquidar.type = ExcelJS.ValueType.Number;
            cell_total_liquidar.numFmt = '0.00';
            cell_total_liquidar.alignment = { horizontal: 'right' };

            const cell_fecha_final_contrato = lastRow.getCell('H');
            cell_fecha_final_contrato.alignment = { horizontal: 'center' };

            const cell_fecha_ultimo_pago = lastRow.getCell('I');
            cell_fecha_ultimo_pago.alignment = { horizontal: 'center' }

        }));


        // Escribir el libro de Excel en un stream
        const buffer = await workbook.xlsx.writeBuffer();

        // Configurar los headers de la respuesta HTTP
        res.setHeader('Content-disposition', 'attachment; filename=reporte_cartas.xlsx');
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo XLS como respuesta
        res.send(buffer);

    } catch (error) {
        console.log('Error al generar el reporte en XLS:', error);
        res.status(500).json({ error: 'Error al generar el reporte en XLS' });
    }

}

const printReporteDebitoAgenciasPDF = async (req, res = response) => {

    const { id, zona_id, agencia_id } = req.body;

    //Iniciamos leyendo la plantilla del contrato
    const template = fs.readFileSync('./views/template_debito_agencias.hbs', 'utf-8');

    //const { rows } = await pool.query(queries.getReporteCartasUNION, values);
    const [rows] = await Credito.devuelveRegistrosReporteCartas(id, zona_id, agencia_id);

    const semanaReporte = await Semana.findOne({
        where: {
            id: id
        }
    });

    const zona = await Zona.findOne({
        where: {
            id: zona_id
        }
    });

    const encabezado_reporte = {
        zona_numero: zona.nombre,
        semana: semanaReporte.weekyear,
        reporte_fecha_inicio: semanaReporte.fecha_inicio
    };

    const fechaInicioSemanaReporte = new Date(semanaReporte.fecha_inicio);

    const creditosJSON = await Promise.all(rows.map(async (credito, index) => {

        const ultimoPago = await Pago.findOne({
            where: {
                credito_id: credito.credito_id,
            },
            order: [['fecha', 'DESC']]
        });

        let fechaOriginal = '';
        let fechaFormateada = '';

        let semanaAtraso = 0;
        let clasificacion = '';

        let diffDias;


        if (ultimoPago) {

            // Obtenemos la fecha del último pago y la convertimos a un objeto Date
            const fechaUltimoPago = new Date(ultimoPago.fecha);

            // Restamos la fecha del último pago a la fecha_fin de la semana del reporte
            const diffTiempo = fechaInicioSemanaReporte.getTime() - fechaUltimoPago.getTime();

            // Convertimos la diferencia de tiempo a días
            diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            fechaOriginal = ultimoPago.fecha;

            //semanaAtraso = Math.ceil(diffDias / 7);
            semanaAtraso = Math.round(diffDias / 7);


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

            //Debemos de ver los casos cuando apenas empezaran a pagar

            const fecha_inicio_real = new Date(credito.fecha_inicio_real);
            fecha_inicio_real.setUTCHours(fecha_inicio_real.getUTCHours() - 6);

            if (fecha_inicio_real.getTime() === new Date(fechaInicioSemanaReporte).getTime()) {
                semanaAtraso = 0;
            }

        }

        if (semanaAtraso < 0) {
            clasificacion = 'Visita/Llamada';
        } else if (semanaAtraso > 14) {
            clasificacion = 'Extrajudicial';
        } else {

            let clasificaciones = {
                0: 'Visita/Llamada',
                1: 'Visita/Llamada',
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


        let total_liquidar = 0;

        const num_dias_penalizaciones = await BalanceSemanal.sum('num_dias_penalizacion_semanal', {
            where: {
                credito_id: credito.credito_id,
                fecha_inicio: {
                    [Sequelize.Op.lt]: fechaInicioSemanaReporte
                }
            }
        });

        let monto_total_penalizaciones = Number(num_dias_penalizaciones) * (Number(credito.monto_otorgado) * 0.010);

        total_liquidar = ((credito.monto_total) - (credito.monto_total_pagado)) + Number(monto_total_penalizaciones);

        total_liquidar = Number(total_liquidar).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // console.log(`Credito_id: ${credito.credito_id}`);
        // console.log(`Total a liquidar: ${total_liquidar}`);
        // console.log(`Monto total de penalizaciones: ${monto_total_penalizaciones}`);
        // console.log('PENALIZACIONES;', num_dias_penalizaciones);

        const fechaFinProgramadoContrato = new Date(credito.fecha_fin_prog2);

        // console.log('FEcha fin contrato', credito.fecha_fin_prog);
        // console.log('Fecha Fin Contrato Date', fechaFinProgramadoContrato);
        // console.log('Fecha Inicio Semana', fechaInicioSemanaReporte);
        // console.log('Semanas de Atraso', semanaAtraso);


        return {
            index: index + 1,
            num_contrato: credito.num_contrato,
            num_contrato_historico: credito.num_contrato_historico,
            zona: credito.zona,
            agencia: credito.agencia,
            nombre: credito.nombre_completo,
            direccion: credito.direccion,
            telefono: credito.telefono,
            fecha_fin_prog: credito.fecha_fin_prog,
            fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '-',
            monto_otorgado: credito.monto_otorgado,
            monto_semanal: credito.monto_semanal,
            semanas_atraso: semanaAtraso != null ? semanaAtraso : '',
            estatus: fechaFinProgramadoContrato < fechaInicioSemanaReporte ? 'Vencido' : 'Vigente',
            total_pagado: credito.monto_total_pagado,
            total_liquidar: total_liquidar,
            total_penalizaciones: credito.total_penalizaciones,
            monto_total: credito.monto_total,
            accion_correspondiente: clasificacion,
        }

    }));

    const cantidadRegistros = creditosJSON.length;


    const DOC = handlebars.compile(template);

    //Aqui pasamos data al template hbs
    const html = DOC({ creditosJSON, cantidadRegistros, encabezado_reporte });

    const browser = await puppeteer.launch({
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(200000);
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

const printReporteDebitoAgenciasXLS = async (req, res, next) => {

    try {

        const { id, zona_id, agencia_id } = req.body;

        const [rows] = await Credito.devuelveRegistrosReporteCartas(id, zona_id, agencia_id);

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte Debito Agencias');

        // Definir encabezados de las columnas y el tipo de datos
        worksheet.columns = [
            { header: '#', key: 'indice', },
            { header: 'Zona', key: 'zona', style: { numFmt: '0' } },
            { header: 'Agencia', key: 'agencia' },
            { header: 'Número de Contrato', key: 'num_contrato', width: 20 }, // Formato de número sin decimales
            { header: 'Número de Contrato Histórico', key: 'num_contrato_historico', width: 30 },
            { header: 'Nombre', key: 'nombre', width: 60 },
            { header: 'M', key: 'Mie', width: 4 },
            { header: 'J', key: 'Jue', width: 4 },
            { header: 'V', key: 'Vie', width: 4 },
            { header: 'S', key: 'Sab', width: 4 },
            { header: 'D', key: 'Dom', width: 4 },
            { header: 'L', key: 'Lun', width: 4 },
            { header: 'A', key: 'Aaa', width: 4 },
            { header: 'B', key: 'Bbb', width: 4 },
            { header: 'O', key: 'Ooo', width: 4 },
            { header: 'Tarifa Semanal', key: 'monto_semanal', width: 15, },
            { header: 'Adeudo para liquidar', key: 'total_liquidar', width: 20, },
            { header: 'Fecha Final de Contrato', key: 'fecha_fin_prog', width: 20, },
            { header: 'Último Pago', key: 'fecha_ultimo_pago', width: 20, },
            { header: 'Semanas de Atraso', key: 'semanas_atraso' },
            { header: 'Estatus', key: 'estatus' },
            { header: 'Acción Correspondiente', key: 'accion_correspondiente', width: 20 },
        ];

        const semanaReporte = await Semana.findOne({
            where: {
                id: id
            }
        });

        const fechaInicioSemanaReporte = new Date(semanaReporte.fecha_inicio);

        let indice = 1;

        // Iterar sobre los créditos y calcular las acciones correspondientes
        await Promise.all(rows.map(async (credito) => {

            const ultimoPago = await Pago.findOne({
                where: {
                    credito_id: credito.credito_id,
                },
                order: [['fecha', 'DESC']]
            });

            let fechaOriginal = '';
            let fechaFormateada = '';

            let semanaAtraso = 0;
            let clasificacion = '';

            let diffDias;

            if (ultimoPago) {

                // Obtenemos la fecha del último pago y la convertimos a un objeto Date
                const fechaUltimoPago = new Date(ultimoPago.fecha);

                // Restamos la fecha del último pago a la fecha_fin de la semana del reporte
                const diffTiempo = fechaInicioSemanaReporte.getTime() - fechaUltimoPago.getTime();

                // Convertimos la diferencia de tiempo a días
                diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

                fechaOriginal = ultimoPago.fecha;

                //semanaAtraso = Math.ceil(diffDias / 7);
                semanaAtraso = Math.round(diffDias / 7);


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

                //Debemos de ver los casos cuando apenas empezaran a pagar

                const fecha_inicio_real = new Date(credito.fecha_inicio_real);
                fecha_inicio_real.setUTCHours(fecha_inicio_real.getUTCHours() - 6);

                if (fecha_inicio_real.getTime() === new Date(fechaInicioSemanaReporte).getTime()) {
                    semanaAtraso = 0;
                }

            }

            if (semanaAtraso < 0) {
                clasificacion = 'Visita/Llamada';
            } else if (semanaAtraso > 14) {
                clasificacion = 'Extrajudicial';
            } else {

                let clasificaciones = {
                    0: 'Visita/Llamada',
                    1: 'Visita/Llamada',
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

            let total_liquidar = 0;

            const num_dias_penalizaciones = await BalanceSemanal.sum('num_dias_penalizacion_semanal', {
                where: {
                    credito_id: credito.credito_id,
                    fecha_inicio: {
                        [Sequelize.Op.lt]: semanaReporte.fecha_inicio
                    }
                }
            });

            let monto_total_penalizaciones = Number(num_dias_penalizaciones) * (Number(credito.monto_otorgado) * 0.010);

            total_liquidar = parseFloat((credito.monto_total) - (credito.monto_total_pagado)) + Number(monto_total_penalizaciones);

            let monto_semanal = parseFloat(credito.monto_semanal)

            const fechaFinProgramadoContrato = new Date(credito.fecha_fin_prog2);


            // Agregar fila al worksheet
            worksheet.addRow({
                indice: indice,
                num_contrato: credito.num_contrato,
                num_contrato_historico: credito.num_contrato_historico,
                zona: parseInt(credito.zona),
                agencia: parseInt(credito.agencia),
                nombre: credito.nombre_completo,
                Mie: 'M',
                Jue: 'J',
                Vie: 'V',
                Sab: 'S',
                Dom: 'D',
                Lun: 'L',
                Aaa: 'A',
                Bbb: 'B',
                Ooo: 'O',
                fecha_fin_prog: credito.fecha_fin_prog,
                fecha_ultimo_pago: fechaFormateada ? fechaFormateada : '-',
                monto_otorgado: credito.monto_otorgado,
                monto_semanal: monto_semanal,
                semanas_atraso: semanaAtraso != null ? semanaAtraso : '',
                estatus: fechaFinProgramadoContrato < fechaInicioSemanaReporte ? 'Vencido' : 'Vigente',
                total_pagado: credito.monto_total_pagado,
                total_liquidar: total_liquidar,
                total_penalizaciones: credito.total_penalizaciones,
                monto_total: credito.monto_total,
                accion_correspondiente: clasificacion,
            });

            const styleColumns = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DDDDDD' }
            }

            //Pintamos de color gris unicamente el row 1
            const row1 = worksheet.getRow(1);
            row1.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = styleColumns
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'V1',
            };

            const lastRow = worksheet.lastRow;

            const setAlignment = (row, cells, alignment) => {
                cells.forEach((cellKey) => {

                    const cell = row.getCell(cellKey);

                    cell.alignment = alignment;
                });
            };

            // Asumimos que 'lastRow' es la última fila
            const alignmentConfig = { horizontal: 'center' };
            const cellsToAlign = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

            setAlignment(lastRow, cellsToAlign, alignmentConfig);

            const cell_monto_semanal = lastRow.getCell('P');
            cell_monto_semanal.type = ExcelJS.ValueType.Number;
            cell_monto_semanal.numFmt = '0.00';
            cell_monto_semanal.alignment = { horizontal: 'right' };

            const cell_total_liquidar = lastRow.getCell('Q');
            cell_total_liquidar.type = ExcelJS.ValueType.Number;
            cell_total_liquidar.numFmt = '0.00';
            cell_total_liquidar.alignment = { horizontal: 'right' };

            const cell_fecha_final_contrato = lastRow.getCell('R');
            cell_fecha_final_contrato.alignment = { horizontal: 'center' };

            const cell_fecha_ultimo_pago = lastRow.getCell('S');
            cell_fecha_ultimo_pago.alignment = { horizontal: 'center' };


            indice++;

        }));

        // Escribir el libro de Excel en un stream
        const buffer = await workbook.xlsx.writeBuffer();

        // Configurar los headers de la respuesta HTTP
        res.setHeader('Content-disposition', 'attachment; filename=reporte_debito_agencias.xlsx');
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo XLS como respuesta
        res.send(buffer);

    } catch (error) {
        console.log('Error al generar el reporte en XLS:', error);
        res.status(500).json({ error: 'Error al generar el reporte en XLS' });
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
            fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2, fecha_fin_prog_proyecta } = resultado.rows[0];

        result['contrato'] = {
            rows
        }

        console.log(fecha_fin_prog_proyecta);


        result['credito'] = {
            num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
            monto_semanal, fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2, fecha_fin_prog_proyecta,
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

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_entrega_creditos.hbs', 'utf-8');

        //obtenemos la consult del contrato
        const result = await pool.query(queries.getCreditosPreaprobados, values);

        let query = `SELECT '${fecha_entrega_prog}' as fecha_entrega_programada,
        TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','CN'),'999,999D99')) as monto_cn,
        TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','R'),'999,999D99')) as monto_r,
        fu_get_count_cn_r('${fecha_entrega_prog}') as count_cn_r,
        fu_get_count_cn('${fecha_entrega_prog}','CN') as count_cn,
        fu_get_count_r('${fecha_entrega_prog}','R') as count_r,
        TRIM(TO_CHAR(fu_get_monto_total_creditos_preaprobados($1),'999,999D99')) as monto_total_creditos`;

        const resultado = await pool.query(query, values);

        //Helpers
        handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        const DOC = handlebars.compile(template);

        console.log('resultado', result.rows);

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
    printReporteCartas,
    printReporteCartasXLS,
    printReporteDebitoAgenciasPDF,
    printReporteDebitoAgenciasXLS
} 