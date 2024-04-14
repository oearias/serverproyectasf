const { response } = require('express');
const bcryptjs = require('bcryptjs')
const pool = require('../database/connection');
const mensajes = require('../helpers/messages');
const { generarJWT } = require('../helpers/generate-jwt');
const User = require('../models/usuario');
const PermisoModulo = require('../models/permiso_modulo');
const Modulo = require('../models/modulos');
const UserGroup = require('../models/user_group');
const PermisoSubmodulo = require('../models/permisos_submodulos');
const Submodulo = require('../models/submodulo');
const Session = require('../models/session');
const Usuario = require('../models/usuario');


const login = async (req, res = response) => {

    try {

        const { email } = req.body;
        const pass = req.body.password;

        const user_founded = await User.findOne({
            include: {
                model: UserGroup,
                as: 'userGroup'
            },
            where: {
                usuario: email
            }
        });


        if(!user_founded){
            return res.json({
                msg: 'El correo no existe en la base de datos'
            });
        }

        const permisos_modulos = await PermisoModulo.findAll({
            include: {
                model: Modulo,
                as: 'modulo',
                attributes: ['id','nombre','icon','orden'],
                order: ['orden','ASC']
            },
            where: {
                user_group_id: user_founded.userGroup.id
            },
        });

        const permisos_submodulos = await PermisoSubmodulo.findAll({
            include:{
                model: Submodulo,
                as: 'submodulo',
                attributes: ['nombre','url','icon','orden','modulo_id']
            },
            where: {
                user_group_id: user_founded.userGroup.id
            }
        })

        const modulos = [];
        
        if(permisos_modulos){

            permisos_modulos.forEach(permiso_modulo => {

                const submodulos = [];

                permisos_submodulos.forEach(permiso_submodulo =>{
                    
                    if(permiso_submodulo.submodulo.modulo_id === permiso_modulo.modulo.id){

                        let submodulo = {
                            submodulo_id: permiso_submodulo.submodulo.id,
                            titulo: permiso_submodulo.submodulo.nombre,
                            icon: permiso_submodulo.submodulo.icon,
                            url: permiso_submodulo.submodulo.url,
                            modulo_id: permiso_submodulo.submodulo.modulo_id
                        }

                        submodulos.push(submodulo);

                    }
                })

                let modulo = {
                    modulo_id: permiso_modulo.modulo.id,
                    titulo: permiso_modulo.modulo.nombre,
                    icono: permiso_modulo.modulo.icon,
                    submenu: submodulos 
                }

                modulos.push(modulo);

                // console.log(permiso.modulo.nombre);
            });
        }

        //const {id, nombre, usuario, apellido_paterno, apellido_materno, role } = rows[0];
        const {id, nombre, usuario, apellido_paterno, apellido_materno, role, password } = user_founded;


        // const pass = rows[0]['password'];

        //Varificar la contraseña, comparamos
        const validPassword = bcryptjs.compareSync(pass, password);

        if(!validPassword){
            return res.status(400).json({
                msg: 'Usuario o contraseña son incorrectos'
            })
        }

        //Generar el JWT
        const token = await generarJWT(id);

        //Creamos nuevo registro de sesion
        const new_session = await Session.create({
            usuario_id: user_founded.id,
            session_in: new Date(),
            session_last_check: new Date(),
            session_status: 'A'
        });

        const data = {
            usuario_id: id,
            nombre,
            usuario,
            apellido_paterno,
            apellido_materno,
            modulos,
            token,
            role: user_founded.userGroup.nombre,
            session: {
                session_id: new_session.id,
                usuario_id: new_session.usuario_id,
                session_in: new_session.session_in,
                sesion_status: new_session.session_status
            }
        }

        console.log(data);

        res.status(200).json(
            data
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const logout = async (req, res = response, next) => {

    try {

        console.log('si llegamos al controller de salida');
        
        const { usuario_id, session_id } = req.body;

        console.log(req.body);

        const usuario = await Usuario.findOne({
            where:{
                id:  usuario_id
            }
        });

        const sesion_actual = await Session.findOne({
            where: {
                id: session_id
            }
        });

        if(sesion_actual.session_status == 'A'){
            //sesiones del usuario

            sesion_actual.update({
                session_out: new Date(),
                session_lastcheck: new Date(),
                session_status: 'I'
            })

        }

        req.session.destroy();
        res.json({
            message: 'Sesión finalizada correctamente'
        })



    } catch (error) {


        res.status(400).send(error);
        next()
        
    }

}

module.exports = {
    login,
    logout
}