const { response } = require('express');
const pool = require('../database/connection');
const { Op, Sequelize } = require('sequelize');

const sequelize = require('../database/config');

//Queries y utilidades
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');

const SolicitudCredito = require('../models/solicitud_credito');
const Cliente = require('../models/cliente');
const Aval = require('../models/aval');
const Negocio = require('../models/negocio');
const Agencia = require('../models/agencia');
const Zona = require('../models/zona');
const TipoEstatusSolicitud = require('../models/tipo_estatus_solicitud');
const Credito = require('../models/credito');
const Tarifa = require('../models/tarifa');
const SolicitudEvento = require('../models/solicitud_evento');
const SolicitudServicio = require('../models/solicitud_servicio');
const Sucursal = require('../models/sucursal');
const Colonia = require('../models/colonia');

const solicitudCreditoGet = async (req, res = response) => {

    console.log('get solicitud');

    try {

        const { id } = req.params;

        const solicitud_credito = await SolicitudCredito.findOne({
            include: [
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: Cliente,
                    as: 'cliente',
                },
                {
                    model: Aval,
                    as: 'aval',
                    include: {
                        model: Colonia,
                        as: 'colonia'
                    }
                },
                {
                    model: Negocio,
                    as: 'negocio',
                    include: {
                        model: Colonia,
                        as: 'colonia'
                    }
                },
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
                }, {
                    model: SolicitudServicio,
                    as: 'solicitudServicio'
                }, {
                    model: Colonia,
                    as: 'colonia'
                }
            ],
            where: {
                id: id
            }
        });

        console.log(solicitud_credito);

        res.status(200).json(
            solicitud_credito
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const solicitudCreditoGetException = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getSolCreditoExceptions, values);

        res.status(200).json(
            rows
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const solicitudCreditosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getSolCreditos);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const getSolicitudesCreditoPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        console.log(searchTerm);

        const { count, rows } = await SolicitudCredito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente'
                },
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona'
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: TipoEstatusSolicitud,
                    as: 'tipoEstatusSolicitud'
                }
            ],
            where: {
                [Op.or]: [
                    Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                    Sequelize.literal(`LOWER("SolicitudCredito"."id"::TEXT) LIKE LOWER('%${searchTerm}%')`)
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const solicitudesJSON = rows.map((solicitud) => {
            return {
                id: solicitud.id,
                fecha_solicitud: solicitud.fecha_solicitud,
                nombre_completo: solicitud.cliente.getNombreCompleto(),
                zona: solicitud.agencia.zona.nombre,
                agencia: solicitud.agencia.nombre,
                tarifa: solicitud.tarifa,
                monto: solicitud.monto,
                estatus: solicitud.tipoEstatusSolicitud.nombre,
                estatus_sol_id: solicitud.tipoEstatusSolicitud.id
            }
        });


        res.status(200).json({
            solicitudesJSON,
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

const getSolicitudesCreditoPorAprobarPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await SolicitudCredito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente'
                },
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona'
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: TipoEstatusSolicitud,
                    as: 'tipoEstatusSolicitud'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Sequelize.Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("SolicitudCredito"."id"::TEXT) LIKE LOWER('%${searchTerm}%')`)
                        ]
                    },
                    {
                        estatus_sol_id: 3 //Enviadas a revisión
                    }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const solicitudesJSON = rows.map((solicitud) => {
            return {
                id: solicitud.id,
                fecha_solicitud: solicitud.fecha_solicitud,
                nombre_completo: solicitud.cliente.getNombreCompleto(),
                zona: solicitud.agencia.zona.nombre,
                agencia: solicitud.agencia.nombre,
                monto: solicitud.tarifa.monto,
                estatus: solicitud.tipoEstatusSolicitud.nombre,
                estatus_sol_id: solicitud.tipoEstatusSolicitud.id
            }
        });

        console.log(solicitudesJSON);


        res.status(200).json({
            solicitudesJSON,
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

const getSolicitudesToModifyPaginados = async (req, res = response) => {

    try {

        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        // const searchTermLower = searchTerm.toLowerCase();

        const { count, rows } = await SolicitudCredito.findAndCountAll({

            include: [
                {
                    model: Cliente,
                    as: 'cliente'
                },
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona'
                    }
                },
                {
                    model: Tarifa,
                    as: 'tarifa'
                },
                {
                    model: TipoEstatusSolicitud,
                    as: 'tipoEstatusSolicitud'
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Sequelize.Op.or]: [
                            Sequelize.literal(`LOWER("cliente"."nombre") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_paterno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("cliente"."apellido_materno") LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER(CONCAT("cliente"."nombre", ' ', "cliente"."apellido_paterno", ' ', "cliente"."apellido_materno")) LIKE LOWER('%${searchTerm}%')`),
                            Sequelize.literal(`LOWER("SolicitudCredito"."id"::TEXT) LIKE LOWER('%${searchTerm}%')`)
                        ]
                    },
                    {
                        estatus_sol_id: 9 //Enviadas a modificacion
                    }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['id', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        const solicitudesJSON = rows.map((solicitud) => {
            return {
                id: solicitud.id,
                fecha_solicitud: solicitud.fecha_solicitud,
                nombre_completo: solicitud.cliente.getNombreCompleto(),
                zona: solicitud.agencia.zona.nombre,
                agencia: solicitud.agencia.nombre,
                monto: solicitud.tarifa.monto,
                estatus: solicitud.tipoEstatusSolicitud.nombre,
                estatus_sol_id: solicitud.tipoEstatusSolicitud.id
            }
        });

        console.log(solicitudesJSON);


        res.status(200).json({
            solicitudesJSON,
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

const solicitudCreditosGetTotal = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getSolCreditosTotales);

        res.status(200).json(rows[0]);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

// const solicitudCreditoPost = async (req, res = response) => {

//     try {

//         const { body } = req;

//         const {cliente} = body;

//         req.body.fecha_creacion = new Date().toISOString();

//         console.log(req.body);

//         //preguntamos si ya existe el cliente_id, sino existe lo creamos
//         if (!req.body.cliente_id) {

//             // req.body.cliente.sucursal_id = req.body.sucursal_id;
//             req.body.cliente.agencia_id = req.body.agencia_id;

//             let queryInsertClient = buildPostQuery(tableUSer, req.body.cliente);

//             const resultClient = await pool.query(queryInsertClient);

//             if (resultClient) {
//                 const cliente_id = resultClient.rows[0]['id'];
//                 req.body.cliente_id = cliente_id;
//             }

//         }

//         req.body.calle = req.body.cliente.calle;
//         req.body.num_int = req.body.cliente.num_int;
//         req.body.num_ext = req.body.cliente.num_ext;
//         req.body.cruzamientos = req.body.cliente.cruzamientos;
//         req.body.referencia = req.body.cliente.referencia;
//         req.body.colonia_id = req.body.cliente.colonia_id;
//         req.body.municipio = req.body.cliente.municipio;
//         req.body.localidad = req.body.cliente.localidad;
//         req.body.estado = req.body.cliente.estado;

//         const servicios = {
//             luz: req.body.servicios.luz,
//             agua_potable: req.body.servicios.agua_potable,
//             auto_propio: req.body.servicios.auto_propio,
//             telefono_fijo: req.body.servicios.telefono_fijo,
//             telefono_movil: req.body.servicios.telefono_movil,
//             refrigerador: req.body.servicios.refrigerador,
//             estufa: req.body.servicios.estufa,
//             internet: req.body.servicios.internet,
//             gas: req.body.servicios.gas,
//             tv: req.body.servicios.tv,
//             alumbrado_publico: req.body.servicios.alumbrado_publico
//         }

//         delete req.body.dependientes;
//         delete req.body.cliente;
//         delete req.body.servicios;
//         delete req.body.id;
//         delete req.body.sucursal_id;
//         delete req.body.zona_id;
//         delete req.body.observaciones;

//         //Consulta del insert solicitud
//         let consulta = buildPostQuery(table, req.body);

//         console.log(consulta);

//         //Creamos al cliente

//         const cliente_creado = await Cliente.create({
//             nombre: cliente.nombre,

//         })

//         //Creamos la solicitud

//         const solicitud_credito = await SolicitudCredito.create({
//             tarifa_id: body.tarifa_id,
//             estatus_sol_id: body.estatus_sol_id,
//             agencia_id: body.agencia_id
//         })

//         const result = await pool.query(consulta);

//         const solicitud_id = result.rows[0]['id'];

//         const values = [
//             solicitud_id,
//             servicios.luz,
//             servicios.agua_potable,
//             servicios.auto_propio,
//             servicios.telefono_fijo,
//             servicios.telefono_movil,
//             servicios.refrigerador,
//             servicios.estufa,
//             servicios.internet,
//             servicios.gas,
//             servicios.tv,
//             servicios.alumbrado_publico
//         ]

//         const { rows } = await pool.query(queries.insertServicios, values);

//         if (result.rows[0]['id']) {

//             res.status(201).json(
//                 `La solicitud: ${result.rows[0]['id']} ha sido añadida correctamente.`
//             );

//         }

//     } catch (error) {

//         console.log(error);

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

const solicitudCreditoPost = async (req, res = response) => {

    console.log('entramos al controller');

    let t;
    let clienteId;

    try {

        const { body } = req;

        const { cliente, servicios, aval, negocio, tipo_solicitud } = body;

        clienteId = body.cliente_id

        t = await sequelize.transaction();

        //Ahora debemos de saber que tipo de Solicitud es...
        //1.PERSONAL - 2.MICRONEGOCIO

        //preguntamos si ya existe el cliente_id, sino existe lo creamos
        if (!body.cliente_id) {

            //TODO: Pendiente completar los otros datos no obligatorios
            //Creamos al cliente si no existe
            const cliente_creado = await Cliente.create({
                nombre: cliente.nombre,
                apellido_paterno: cliente.apellido_paterno,
                apellido_materno: cliente.apellido_materno,
                telefono: cliente.telefono,
                sexo: cliente.sexo,
                agencia_id: body.agencia_id,
                fecha_nacimiento: cliente.fecha_nacimiento,
                email: cliente.email,
                calle: cliente.calle,
                num_ext: cliente.num_ext,
                colonia_id: cliente.colonia_id,
                municipio: cliente.municipio,
                localidad: cliente.localidad,
                estado: cliente.estado,
                cruzamientos: cliente.cruzamientos,
                referencia: cliente.referencia
            }, { transaction: t });

            clienteId = cliente_creado.id;

        } else {

            clienteId = body.cliente_id;

        }

        //Creamos la solicitud
        const solicitud_credito = await SolicitudCredito.create({
            cliente_id: clienteId,
            fecha_solicitud: body.fecha_solicitud,
            estatus_sol_id: body.estatus_sol_id,
            agencia_id: body.agencia_id,
            colonia_id: cliente.colonia_id,
            calle: cliente.calle,
            num_ext: cliente.num_ext,
            num_int: cliente.num_int,
            municipio: cliente.municipio,
            localidad: cliente.localidad,
            estado: cliente.estado,
            fecha_creacion: new Date(),
            tarifa_id: body.tarifa_id,
            nombre_contacto1: body.nombre_contacto1,
            nombre_contacto2: body.nombre_contacto2,
            telefono_contacto1: body.telefono_contacto1,
            telefono_contacto2: body.telefono_contacto2,
            parentesco_contacto1: body.parentesco_contacto1,
            parentesco_contacto2: body.parentesco_contacto2,
            direccion_contacto1: body.direccion_contacto1,
            direccion_contacto2: body.direccion_contacto2,
            tipo_solicitud_credito: tipo_solicitud
        }, { transaction: t });

        //Creamos los servicios
        await SolicitudServicio.create({
            solicitud_credito_id: solicitud_credito.id,
            luz: servicios.luz,
            agua_potable: servicios.agua_potable,
            auto_propio: servicios.auto_propio,
            telefono_fijo: servicios.telefono_fijo,
            telefono_movil: servicios.telefono_movil,
            refrigerador: servicios.refrigerador,
            estufa: servicios.estufa,
            internet: servicios.internet,
            gas: servicios.gas,
            tv: servicios.tv,
            alumbrado_publico: servicios.alumbrado_publico
        }, { transaction: t });

        if (tipo_solicitud == 2) {

            await Aval.create({
                solicitud_credito_id: solicitud_credito.id,
                nombre: aval.nombre,
                apellido_paterno: aval.apellido_paterno,
                apellido_materno: aval.apellido_materno,
                fecha_nacimiento: aval.fecha_nacimiento,
                calle: aval.calle,
                num_ext: aval.num_ext,
                colonia_id: aval.colonia_id,
                telefono: aval.telefono
            }, { transaction: t });

            await Negocio.create({
                solicitud_credito_id: solicitud_credito.id,
                nombre: negocio.nombre,
                giro: negocio.giro,
                calle: negocio.calle,
                num_ext: negocio.num_ext,
                telefono: negocio.telefono,
                hora_pago: negocio.hora_pago,
                colonia_id: negocio.colonia_id
            }, { transaction: t })

        }


        await t.commit();

        res.status(201).json(
            `La solicitud ha sido añadida correctamente.`
        );

    } catch (error) {

        console.log(error);

        await t.rollback();

        res.status(500).json({
            msg: mensajes.errorInterno
        });

    }
}

const solicitudCreditoPut = async (req, res = response) => {

    let t;

    try {

        console.log('procedemos a actualizar');

        const { body, params } = req;
        const { negocio, aval, servicios } = body;

        t = await sequelize.transaction();

        const cliente_founded = await Cliente.findOne({
            where: {
                id: body.cliente_id,
            }
        });

        const solicitudCredito = await SolicitudCredito.findOne({
            where: {
                id: body.id
            }
        });

        const solicitudServiciosFounded = await SolicitudServicio.findOne({
            where: {
                solicitud_credito_id: body.id
            }
        })

        if (body.tipo_solicitud_credito == 'MICRONEGOCIO') {

            const aval_founded = await Aval.findOne({
                where: {
                    solicitud_credito_id: solicitudCredito.id
                }
            });

            const negocio_founded = await Negocio.findOne({
                where: {
                    solicitud_credito_id: solicitudCredito.id
                }
            });

            await aval_founded.update({
                nombre: aval.nombre,
                apellido_paterno: aval.apellido_paterno,
                apellido_materno: aval.apellido_materno,
                fecha_nacimiento: aval.fecha_nacimiento,
                calle: aval.calle,
                num_ext: aval.num_ext,
                colonia_id: aval.colonia_id,
                telefono: aval.telefono
            }, { transaction: t });

            await negocio_founded.update({
                nombre: negocio.nombre,
                giro: negocio.giro,
                calle: negocio.calle,
                num_ext: negocio.num_ext,
                telefono: negocio.telefono,
                hora_pago: negocio.hora_pago,
                colonia_id: negocio.colonia_id
            }, { transaction: t })

        }


        await cliente_founded.update({
            nombre: body.cliente.nombre,
            apellido_paterno: body.cliente.apellido_paterno,
            apellido_materno: body.cliente.apellido_materno,
            telefono: body.cliente.telefono,
            sexo: body.cliente.sexo,
            agencia_id: body.agencia_id,
            fecha_nacimiento: body.cliente.fecha_nacimiento,
            email: body.cliente.email,
            calle: body.cliente.calle,
            num_ext: body.cliente.num_ext,
            colonia_id: body.cliente.colonia_id,
            municipio: body.cliente.municipio,
            localidad: body.cliente.localidad,
            estado: body.cliente.estado,
            cruzamientos: body.cliente.cruzamientos,
            referencia: body.cliente.referencia
        }, { transaction: t });

        await solicitudCredito.update({
            estatus_sol_id: body.estatus_sol_id,
            agencia_id: body.agencia_id,
            colonia_id: body.cliente.colonia_id,
            calle: body.cliente.calle,
            num_ext: body.cliente.num_ext,
            num_int: body.cliente.num_int,
            municipio: body.cliente.municipio,
            localidad: body.cliente.localidad,
            estado: body.cliente.estado,
            tarifa_id: body.tarifa_id,
            nombre_contacto1: body.nombre_contacto1,
            nombre_contacto2: body.nombre_contacto2,
            telefono_contacto1: body.telefono_contacto1,
            telefono_contacto2: body.telefono_contacto2,
            parentesco_contacto1: body.parentesco_contacto1,
            parentesco_contacto2: body.parentesco_contacto2,
            direccion_contacto1: body.direccion_contacto1,
            direccion_contacto2: body.direccion_contacto2,
        }, { transaction: t });

        await solicitudServiciosFounded.update({
            agua_potable: servicios.agua_potable,
            luz: servicios.luz,
            telefono_fijo: servicios.telefono_fijo,
            auto_propio: servicios.auto_propio,
            refrigerador: servicios.refrigerador,
            estufa: servicios.estufa,
            internet: servicios.internet,
            gas: servicios.gas,
            alumbrado_publico: servicios.alumbrado_publico,
            tv: servicios.tv
        }, { transaction: t })


        await t.commit();

        res.status(200).json(
            `La solicitud ha sido modificada correctamente.`
        );

    } catch (error) {

        console.log(error);

        await t.rollback();

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const solicitudCreditoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        const values = [id]

        const result = await pool.query(queries.deleteSolCredito, values);

        res.status(200).json(
            `La solicitud: ${result.rows[0]['id']} ha sido eliminada correctamente.`
        );

    } catch (error) {

        console.log(error);

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

const solicitudGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql = '';
        let cadena_aux = palabra.toUpperCase();

        let select_query = queries.getSolCreditoQueryGenerica;

        let clausula_where = '';
        let order_by = 'ORDER BY a.id'

        switch (criterio) {

            case 'estatus_id':

                clausula_where = `WHERE a.estatus_sol_id = ${palabra}`;

                break;

            case 'nombre':

                clausula_where = `WHERE b.nombre like '%${cadena_aux}%' `

                break;

            case 'apellido_paterno':

                clausula_where = `WHERE b.apellido_paterno like '%${cadena_aux}%'`;

                break;

            case 'apellido_materno':

                clausula_where = `WHERE b.apellido_materno like '%${cadena_aux}%' `

                break;

            case 'num_cliente':

                clausula_where = `WHERE b.num_cliente = ${palabra} `;

                break;

            case 'sol_id':

                clausula_where = `WHERE a.id = ${palabra}`;

                break;

        }

        sql = `${select_query} ${clausula_where}
                ${order_by}`;

        const { rows } = await pool.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);


        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const solicitudCreditoGetByClienteId = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getSolCreditoByClienteId, values);


        res.status(200).json(
            rows[0]
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

//FIXME: Este sirve pero está generando inconsistencia entre la id de la tabla solicitud_creditos y solicitud_credito_id de la tabla creditos
// const solChangeEstatusAprobadaToDelivery = async (req, res = response) => {

//     const solIds = req.body;
//     const fecha_presupuestal = new Date().toISOString();
//     const updatedSolicitudes = [];

//     try {

//         for (const id of solIds) {

//             const result = await pool.query(`CALL pr_crea_credito_preaprobado(${id})`);

//         }


//         res.status(200).json(
//             'Solicitud(es) autorizada(s)'
//         );

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             msg: mensajes.errorInterno
//         })
//     }
// }

//Este cambio se hace el 08 de ago de 2024
const solChangeEstatusAprobadaToDelivery = async (req, res = response) => {

    const solIds = req.body;

    try {

        for (const id of solIds) {

            // Iniciamos una transacción
            await sequelize.transaction(async (t) => {
                for (const id of solIds) {

                    // Ejecuta el procedimiento almacenado para cada ID
                    await sequelize.query('CALL pr_crea_credito_preaprobado(:id)', {
                        replacements: { id },
                        transaction: t
                    });
                }
            });

        }


        res.status(200).json(
            'Solicitud(es) autorizada(s)'
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}


const changeEstatusPendingToApproved = async (req, res = response) => {

    const { body } = req;

    const { id, estatus_sol_id, usuario_id, monto,
        tarifa_id, observaciones, accion } = body;

    let evento, mensaje_respuesta;

    if (accion == 'aprobar') {

        mensaje_respuesta = 'Solicitud autorizada'
        evento = 'AUTORIZADA'

    } else if (accion == 'modificar') {

        mensaje_respuesta = 'Solicitud enviada a modificación'
        evento = 'REQUIERE MODIFICACIÓN'

    } else {

        mensaje_respuesta = 'Solicitud Rechazada'
        evento = 'RECHAZADA'

    }


    const fecha_presupuestal = new Date().toISOString();

    try {

        const solicitud_founded = await SolicitudCredito.findByPk(id);

        if (!solicitud_founded) {
            res.status(500).json({
                msg: mensajes.errorInterno
            })
        }

        await solicitud_founded.update({
            estatus_sol_id,
            monto,
            fecha_presupuestal,
            fecha_aprobacion: fecha_presupuestal,
            aprobado_user_id: usuario_id,
            tarifa_id
        })


        await SolicitudEvento.create({
            solicitud_credito_id: id,
            observacion: observaciones,
            evento: evento,
            fecha: new Date(),
            usuario_id: usuario_id
        })

        //await pool.query(`CALL pr_crea_credito_preaprobado(${id})`);


        res.status(200).json(
            `${mensaje_respuesta}`
        );



    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const createCreditosMasivos = async (req, res = response) => {

    const solIds = req.body;
    const fecha_presupuestal = new Date().toISOString();
    const updatedSolicitudes = [];

    try {

        for (const id of solIds) {

            //Creamos los créditos preaprobados, aqui colocamos el monto total
            const result = await pool.query(`CALL pr_crea_credito_preaprobado(${id})`);


        }


        res.status(200).json(
            'Creditos Creados'
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const getSolicitudesParaPresupuesto = async (req, res = response) => {

    try {

        const { rows } = await SolicitudCredito.findAndCountAll({
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                },
                {
                    model: Tarifa,
                    as: 'tarifa',
                },
                {
                    model: Agencia,
                    as: 'agencia',
                    include: {
                        model: Zona,
                        as: 'zona'
                    }
                }
            ],
            where: {
                estatus_sol_id: 6
            }
        });

        // Crear un array de promesas
        const solicitudesJSONPromises = rows.map(async (sol) => {
            // Verificar si tiene créditos aprobados
            const { count } = await Credito.findAndCountAll({
                where: {
                    cliente_id: sol.cliente.id,
                    entregado: 1
                }
            });

            let cn_r = '';

            if (count >= 1) {
                cn_r = 'Renovación'
            } else {
                cn_r = 'CN'
            }

            return {
                id: sol.id,
                fecha_solicitud: sol.fecha_creacion,
                nombre_completo: sol.cliente.getNombreCompleto(),
                agencia: sol.agencia,
                monto: sol.tarifa.monto,
                creditos_aprobados: count,
                cn_r
            };
        });

        // Esperar a que todas las promesas se resuelvan
        const solicitudesJSON = await Promise.all(solicitudesJSONPromises);

        res.status(200).json({
            solicitudesJSON
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
}


module.exports = {
    getSolicitudesCreditoPaginados,
    getSolicitudesToModifyPaginados,
    getSolicitudesCreditoPorAprobarPaginados,
    solicitudCreditoGet,
    solicitudCreditosGet,
    solicitudCreditoGetException,
    solicitudCreditoPost,
    solicitudCreditoPut,
    solicitudCreditoDelete,
    solicitudGetByCriteria,
    solicitudCreditoGetByClienteId,
    solChangeEstatusAprobadaToDelivery,
    createCreditosMasivos,
    solicitudCreditosGetTotal,
    getSolicitudesParaPresupuesto,
    changeEstatusPendingToApproved
}