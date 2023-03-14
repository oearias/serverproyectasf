const { response } = require('express');
const pool = require('../database/connection');
const moment = require('moment');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery, buildDeleteQueryById } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.solicitud_credito';
const tableUSer = 'dbo.clientes';

const solicitudCreditoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getSolCredito, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {

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

const solicitudCreditoPost = async (req, res = response) => {

    try {

        req.body.fecha_creacion = new Date().toISOString();

        //preguntamos si ya existe el cliente_id, sino existe lo creamos
        if (!req.body.cliente_id) {

            req.body.cliente.sucursal_id = req.body.sucursal_id;

            let queryInsertClient = buildPostQuery(tableUSer, req.body.cliente);

            const resultClient = await pool.query(queryInsertClient);

            if (resultClient) {
                const cliente_id = resultClient.rows[0]['id'];
                req.body.cliente_id = cliente_id;
            }

        }

        req.body.calle = req.body.cliente.calle;
        req.body.num_int = req.body.cliente.num_int;
        req.body.num_ext = req.body.cliente.num_ext;
        req.body.cruzamientos = req.body.cliente.cruzamientos;
        req.body.referencia = req.body.cliente.referencia;
        req.body.colonia_id = req.body.cliente.colonia_id;
        req.body.municipio = req.body.cliente.municipio;
        req.body.localidad = req.body.cliente.localidad;
        req.body.estado = req.body.cliente.estado;

        const servicios = {
            luz: req.body.servicios.luz,
            agua_potable: req.body.servicios.agua_potable,
            auto_propio: req.body.servicios.auto_propio,
            telefono_fijo: req.body.servicios.telefono_fijo,
            telefono_movil: req.body.servicios.telefono_movil,
            refrigerador: req.body.servicios.refrigerador,
            estufa: req.body.servicios.estufa,
            internet: req.body.servicios.internet,
            gas: req.body.servicios.gas,
            tv: req.body.servicios.tv,
            alumbrado_publico: req.body.servicios.alumbrado_publico
        }

        delete req.body.dependientes;
        delete req.body.cliente;
        delete req.body.servicios;
        delete req.body.id;
        delete req.body.sucursal_id;
        delete req.body.zona_id;
        delete req.body.observaciones;

        //Consulta del insert solicitud
        let consulta = buildPostQuery(table, req.body);

        const result = await pool.query(consulta);

        const solicitud_id = result.rows[0]['id'];

        const values = [
            solicitud_id,
            servicios.luz,
            servicios.agua_potable,
            servicios.auto_propio,
            servicios.telefono_fijo,
            servicios.telefono_movil,
            servicios.refrigerador,
            servicios.estufa,
            servicios.internet,
            servicios.gas,
            servicios.tv,
            servicios.alumbrado_publico
        ]

        const { rows } = await pool.query(queries.insertServicios, values);

        if (result.rows[0]['id']) {

            res.status(201).json(
                `La solicitud: ${result.rows[0]['id']} ha sido añadida correctamente.`
            );

        }

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

const solicitudCreditoPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        req.body.calle = req.body.cliente.calle;
        req.body.num_int = req.body.cliente.num_int;
        req.body.num_ext = req.body.cliente.num_ext;
        req.body.cruzamientos = req.body.cliente.cruzamientos;
        req.body.referencia = req.body.cliente.referencia;
        req.body.colonia_id = req.body.cliente.colonia_id;
        req.body.municipio = req.body.cliente.municipio;
        req.body.localidad = req.body.cliente.localidad;
        req.body.estado = req.body.cliente.estado;

        const usuario = req.body.usuario;

        //Borramos vivienda_propia si no hay radiobutton3 seleccionado
        if (req.body.vivienda == 'VIVIENDA PROPIA' || req.body.vivienda == 'VIVIENDA RENTADA') {
            req.body.vivienda_otra = null;
        }

        const servicios = {
            luz: req.body.servicios.luz,
            agua_potable: req.body.servicios.agua_potable,
            auto_propio: req.body.servicios.auto_propio,
            telefono_fijo: req.body.servicios.telefono_fijo,
            telefono_movil: req.body.servicios.telefono_movil,
            refrigerador: req.body.servicios.refrigerador,
            estufa: req.body.servicios.estufa,
            internet: req.body.servicios.internet,
            gas: req.body.servicios.gas,
            tv: req.body.servicios.tv,
            alumbrado_publico: req.body.servicios.alumbrado_publico
        }

        delete req.body.dependientes;
        delete req.body.cliente;
        delete req.body.cliente_id;
        delete req.body.servicios;
        delete req.body.id;
        delete req.body.sucursal_id;
        delete req.body.zona_id;
        delete req.body.usuario;
        delete req.body.fecha_creacion;

        let consulta = buildPatchQuery(id, table, req.body);

        const result = await pool.query(consulta);

        const values = [
            servicios.luz,
            servicios.agua_potable,
            servicios.auto_propio,
            servicios.telefono_fijo,
            servicios.telefono_movil,
            servicios.refrigerador,
            servicios.estufa,
            servicios.internet,
            servicios.gas,
            servicios.tv,
            servicios.alumbrado_publico,
            id
        ]

        const { rows } = await pool.query(queries.updateServicios, values);

        if (req.body.observaciones && usuario) {

            console.log('entra a la condicion');
            console.log(usuario);

            // Obtén la fecha actual
            const currentDate = new Date();

            // Formatea la fecha para que sea compatible con PostgreSQL
            const fechaObservacion = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');

            const resultado = await pool.query(`INSERT INTO dbo.solicitud_eventos (solicitud_credito_id, observacion, fecha, usuario) VALUES(${id}, '${req.body.observaciones}','${fechaObservacion}','${usuario}')`)
        }

        res.status(200).json(
            `La solicitud: ${result.rows[0]['id']} ha sido modificada correctamente.`
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

const solicitudCreditoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        const values = [id]

        const result = await pool.query(queries.deleteSolCredito, values);

        res.status(200).json(
            `La solicitud: ${result.rows[0]['id']} ha sido eliminada correctamente.`
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

const solicitudGetByCriteria = async (req, res = response) => {

    const { criterio, palabra } = req.params;

    try {

        let sql;

        switch (criterio) {

            case 'estatus_id':

                sql = `SELECT a.id, 
                a.estatus_sol_id,
                a.cliente_id,
                a.monto, a.tarifa_id,
                b.apellido_paterno, b.apellido_materno, b.nombre, 
                TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                a.fecha_solicitud, c.nombre as estatus,
                a.locked
                FROM dbo.solicitud_credito a, dbo.clientes b, dbo.tipo_estatus_solicitud c 
                WHERE a.cliente_id = b.id 
                AND a.estatus_sol_id = c.id 
                AND a.estatus_sol_id = ${palabra}
                ORDER BY a.id`;

                break;

            case 'nombre':

                cadena_aux = palabra.toUpperCase();

                sql = `SELECT a.id, 
                a.estatus_sol_id,
                a.cliente_id,
                a.monto, a.tarifa_id,
                b.apellido_paterno, b.apellido_materno, b.nombre, 
                TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                a.fecha_solicitud, c.nombre as estatus,
                a.locked
                FROM dbo.solicitud_credito a, dbo.clientes b, dbo.tipo_estatus_solicitud c 
                WHERE a.cliente_id = b.id 
                AND a.estatus_sol_id = c.id 
                AND b.nombre like '%${cadena_aux}%'
                ORDER BY a.id`;

                break;

            case 'num_cliente':

                sql = `SELECT a.id, 
                    a.estatus_sol_id,
                    a.cliente_id,
                    a.monto, a.tarifa_id,
                    b.apellido_paterno, b.apellido_materno, b.nombre, 
                    TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                    a.fecha_solicitud, c.nombre as estatus,
                    a.locked
                    FROM dbo.solicitud_credito a, 
                    dbo.clientes b, dbo.tipo_estatus_solicitud c 
                    WHERE a.cliente_id = b.id 
                    AND a.estatus_sol_id = c.id 
                    AND b.num_cliente = ${palabra}
                    ORDER BY a.id`;

                break;

            case 'sol_id':

                sql = `SELECT a.id, 
                        a.estatus_sol_id,
                        a.cliente_id,
                        a.monto, a.tarifa_id,
                        b.apellido_paterno, b.apellido_materno, b.nombre, 
                        TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                        a.fecha_solicitud, c.nombre as estatus,
                        a.locked
                        FROM dbo.solicitud_credito a, 
                        dbo.clientes b, dbo.tipo_estatus_solicitud c 
                        WHERE a.cliente_id = b.id 
                        AND a.estatus_sol_id = c.id 
                        AND a.id = ${palabra}
                        ORDER BY a.id`;

                break;

        }


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

const solChangeEstatusAprobadaToDelivery = async (req, res = response) => {

    const solIds = req.body;
    const fecha_presupuestal = new Date().toISOString();
    const updatedSolicitudes = [];

    try {

        for (const id of solIds) {

            //CALL pr_crea_credito_preaprobado(102)

            //const result = await pool.query(`UPDATE dbo.solicitud_credito SET estatus_sol_id = 7, fecha_presupuestal = '${fecha_presupuestal}' WHERE id = ${id} RETURNING*`);

            const result = await pool.query(`CALL pr_crea_credito_preaprobado(${id})`);

            // if (result.rows[0]) {

            //     updatedSolicitudes.push(result.rows[0]['id']);
            // }
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

const createCreditosMasivos = async (req, res = response) => {

    const solIds = req.body;
    const fecha_presupuestal = new Date().toISOString();
    const updatedSolicitudes = [];

    try {

        for (const id of solIds) {

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

module.exports = {
    solicitudCreditoGet,
    solicitudCreditosGet,
    solicitudCreditoGetException,
    solicitudCreditoPost,
    solicitudCreditoPut,
    solicitudCreditoDelete,
    solicitudGetByCriteria,
    solicitudCreditoGetByClienteId,
    solChangeEstatusAprobadaToDelivery,
    createCreditosMasivos
}