const { response } = require('express');
const bcryptjs = require('bcryptjs')
const pool = require('../database/connection');
const mensajes = require('../helpers/messages');
const { generarJWT } = require('../helpers/generate-jwt');

const table = 'dbo.usuarios'

const login = async (req, res = response) => {

    try {

        const { email, password } = req.body;

        //validamos que exista el email
        // const {rows} = await pool.query(`SELECT a.email, a.password, 
        // INITCAP(a.nombre) as nombre, 
        // INITCAP(a.apellido_paterno) as apellido_paterno, 
        // INITCAP(a.apellido_materno) as apellido_materno 
        // FROM ${table} a WHERE a.email = '${email}' `);

        const {rows} = await pool.query(`SELECT a.email, a.password, 
        INITCAP(a.nombre) as nombre, 
        INITCAP(a.apellido_paterno) as apellido_paterno, 
        INITCAP(a.apellido_materno) as apellido_materno,
        a.usuario,
		b.nombre as role
        FROM 
		dbo.usuarios a 
		LEFT JOIN
		dbo.roles b
		on a.role_id = b.id
		WHERE a.email = '${email}' `);

        if(!rows[0]){
            return res.json({
                msg: 'El correo no existe en la base de datos'
            })
        }

        const {id, nombre, usuario, apellido_paterno, apellido_materno, role } = rows[0];
        const pass = rows[0]['password'];

        //Varificar la contraseña
        const validPassword = bcryptjs.compareSync(password, pass);

        if(!validPassword){
            return res.status(400).json({
                msg: 'Usuario o contraseña son incorrectos'
            })
        }

        //Generar el JWT
        const token = await generarJWT(id);

        res.status(200).json({
            nombre,
            usuario,
            apellido_paterno,
            apellido_materno,
            token,
            role
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

module.exports = {
    login
}