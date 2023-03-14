const { response } = require('express');
const pool = require('../database/connection');
const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery, buildGetQuery, buildGetQueryById, buildDeleteQueryById } = require('../database/build-query');
const mensajes = require('../helpers/messages');

const table = 'dbo.cliente_parentela';

const parentelaGetByClienteId = async (req, res = response) => {

    try {

        const { id } = req.params;

        const values = [id];

        const { rows } = await pool.query(queries.getParentelaByClienteId, values);

        res.status(200).json({
            rows
        });

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const parentelaPostArray = async (req, res = response) => {


    const {parentela} = req.body;

    let i = 0;

    const client = await pool.connect()

    if(!parentela){
        return res.status(500).json({
            msg: mensajes.errorInterno
        })
    }

    try {

        for(i = 0; i < parentela.length; i++ ){

            const res = await client.query(queries.insertParentela, [
                parentela[i]['cliente_id'],
                parentela[i]['nombre'],
                parentela[i]['tipo_parentesco_id'],
                parentela[i]['fecha_nacimiento']
            ]);
            
        }

        await client.query('COMMIT');

        res.status(200).json({
            msg:'Los registros se han agregado con éxito',
            parentela
        });

    } catch (error) {

        await client.query('ROLLBACK')

        res.status(500).json({
            msg: mensajes.errorInterno,
        });

    } finally{
        client.release();
    }
}

const parentelaPutByClienteId = async (req, res = response) => {

    const {id} = req.params;
    const {parentela} = req.body;

    let i = 0;

    const client = await pool.connect();

    if(!parentela){
        return res.status(500).json({
            msg: mensajes.errorInterno
        })
    }

    try {

        const query = "UPDATE dbo.cliente_parentela SET cliente_id = $1, nombre = $2, tipo_parentesco_id = $3, fecha_nacimiento = $4 WHERE id = $5; "

        for(i=0; i< parentela.length; i++){
            
            const res = await client.query(query, [
                id,
                parentela[i]['nombre'],
                parentela[i]['tipo_parentesco_id'],
                parentela[i]['fecha_nacimiento'],
                parentela[i]['id'],
            ])
        }

        await client.query('COMMIT');

        res.status(200).json({
            msg:'Los registros se han modificado con éxito',
            parentela
        })

    } catch (error) {

        await client.query('ROLLBACK')

        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    } finally {
        client.release();
    }
}

const parentelaDelete = async (req, res = response) => {

    try {

        const { id } = req.params;

        let consulta = buildDeleteQueryById(table, id);

        const result = await pool.query(consulta);

        res.status(200).json(
            mensajes.registroDelete
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

module.exports = {
    parentelaGetByClienteId,
    parentelaPostArray,
    parentelaPutByClienteId,
    parentelaDelete
}