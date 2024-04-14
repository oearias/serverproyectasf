const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const mensajes = require('../helpers/messages');
const SolicitudEvento = require('../models/solicitud_evento');
const Usuario = require('../models/usuario');

const eventosGet = async (req, res = response) => {

    try {

        const { id } = req.params;

        const eventos = await SolicitudEvento.findAll({
            include:{
                model:Usuario,
                as: 'usuario',
            },
            where:{
                solicitud_credito_id: id
            }
        });

        res.status(200).json(
            eventos
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

module.exports = {
    eventosGet,
}