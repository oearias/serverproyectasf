const { response, text } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { formatFecha } = require('../helpers/formatFecha');
const mensajes = require('../helpers/messages');

const balanceGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const fecha_consulta = formatFecha( new Date().toISOString() );

        //Preguntamos si está bloqueado el credito
        const { rows } = await pool.query(`SELECT locked from dbo.creditos where id = ${id}`);


        if(rows[0]['locked'] === 1){
            await pool.query(`CALL pr_calculate_recargo_credito333(${id}, '${fecha_consulta}') `);
        }

        const result = await pool.query(queries.getBalance, values);

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

module.exports = {
    balanceGet,
}