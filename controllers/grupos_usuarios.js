const { response } = require('express');

const Cliente = require('../models/cliente');

const { Op, Sequelize } = require('sequelize');

const mensajes = require('../helpers/messages');
const UserGroup = require('../models/user_group');
const Modulo = require('../models/modulos');
const PermisoModulo = require('../models/permiso_modulo');
const Submodulo = require('../models/submodulo');
const PermisoSubmodulo = require('../models/permisos_submodulos');

const getGrupoUsuario = async (req, res) => {

    try {

        const { id } = req.params; // Suponiendo que el ID del grupo se pasa como un parámetro en la URL.

        // Busca el grupo de usuario por su ID.
        const userGroup = await UserGroup.findByPk(id);

        if (!userGroup) {
            return res.status(404).json({
                error: 'El grupo de usuario no se encontró'
            });
        }

        res.status(200).json({
            id: userGroup.id,
            nombre: userGroup.nombre,
            descripcion: userGroup.descripcion
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
};

const getGruposUsuarios = async (req, res = response) => {


    try {
        const { page, limit, searchTerm } = req.query;

        const pageNumber = parseInt(page) >= 1 ? parseInt(page) : 1;
        const limitPerPage = parseInt(limit) >= 1 ? parseInt(limit) : 10;

        const offset = (pageNumber - 1) * limitPerPage;

        const { count, rows } = await UserGroup.findAndCountAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.like]: `%${searchTerm}%` } },
                    { descripcion: { [Op.like]: `%${searchTerm}%` } }
                ]
            },
            offset,
            limit: limitPerPage,
            order: [['nombre', 'ASC']]
        });

        const totalElements = count;
        const totalPages = Math.ceil(totalElements / limitPerPage);

        res.status(200).json({
            gruposUsuariosJSON: rows,
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

const getGruposUsuariosList = async (req, res = response) => {


    try {

        const {rows} = await UserGroup.findAndCountAll({
        });

        res.status(200).json({
            gruposUsuariosJSON: rows,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
};

const grupoUsuarioPost = async (req, res = response) => {

    try {

        console.log(req.body);


        const { nombre, descripcion } = req.body;

        const new_user_group = await UserGroup.create({
            nombre,
            descripcion
        })

        if (!new_user_group) {
            return res.status(500).json({
                error: 'Algo ha ido mal'
            })
        }

        res.status(200).json(
            `Grupo de usuario ha sido añadido correctamente`
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const grupoUsuarioPut = async (req, res) => {
    try {

        const { id } = req.params; // Suponiendo que el ID del grupo se pasa como un parámetro en la URL.
        const { nombre, descripcion } = req.body;

        // Verifica si el grupo de usuario con el ID proporcionado existe.
        const existingUserGroup = await UserGroup.findByPk(id);

        if (!existingUserGroup) {
            return res.status(404).json({
                error: 'El grupo de usuario no se encontró'
            });
        }

        // Actualiza el grupo de usuario con los nuevos datos.
        existingUserGroup.nombre = nombre;
        existingUserGroup.descripcion = descripcion;
        await existingUserGroup.save();

        res.status(200).json('Grupo de usuario ha sido actualizado correctamente');
    } catch (error) {
        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
};

const grupoUsuarioDelete = async (req, res) => {
    try {
        const { id } = req.params; // Suponiendo que el ID del grupo se pasa como un parámetro en la URL.

        // Busca el grupo de usuario por su ID.
        const userGroup = await UserGroup.findByPk(id);

        if (!userGroup) {
            return res.status(404).json({
                error: 'El grupo de usuario no se encontró'
            });
        }

        //Debemos de eliminar primero los permisos que le pertenezca a ese grupo de usuario
        await PermisoModulo.destroy({
            where: {
                user_group_id: userGroup.id,
            },
        });

        await PermisoSubmodulo.destroy({
            where: {
                user_group_id: userGroup.id,
            },
        });



        // Elimina el grupo de usuario.
        await userGroup.destroy();

        res.status(200).json('Grupo de usuario eliminado correctamente');

    } catch (error) {
        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
};

const getPermisosModulosByGrupoUsuarioId = async (req, res) => {

    try {

        const { id } = req.params;

        const modulos = await Modulo.findAll({

        });

        const submodulos = await Submodulo.findAll({

        })

        const permisos_modulos = await PermisoModulo.findAll({
            include: [
                {
                    model: Modulo,
                    as: 'modulo'
                }
            ],
            where: {
                user_group_id: id
            }
        });

        const permisos_submodulos = await PermisoSubmodulo.findAll({
            include: [
                {
                    model: Submodulo,
                    as: 'submodulo'
                }
            ],
            where: {
                user_group_id: id
            }
        });

        res.status(200).json({
            modulos,
            submodulos,
            permisos_modulos,
            permisos_submodulos
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
};

const updatePermisosPost = async (req, res = response) => {

    try {

        const {
            user_group_id,
            permisosModulosSeleccionados,
            permisosSubmodulosSeleccionados,
        } = req.body;

        // Borrar todos los permisos generales de módulos
        const permisosModulosGenerales = await PermisoModulo.findAll({
            where: {
                user_group_id: user_group_id,
            },
        });

        for (const permisoModulo of permisosModulosGenerales) {
            await permisoModulo.destroy();
        }

        // Crear nuevos permisos de módulos seleccionados
        for (const permisoModulo of permisosModulosSeleccionados) {
            await PermisoModulo.create({
                modulo_id: permisoModulo,
                user_group_id,
            });
        }

        // Borrar todos los permisos generales de submódulos
        const permisosSubmodulosGenerales = await PermisoSubmodulo.findAll({
            where: {
                user_group_id: user_group_id,
            },
        });

        for (const permisoSubmodulo of permisosSubmodulosGenerales) {
            await permisoSubmodulo.destroy();
        }

        // Crear nuevos permisos de submódulos seleccionados
        for (const permisoSubmodulo of permisosSubmodulosSeleccionados) {
            await PermisoSubmodulo.create({
                submodulo_id: permisoSubmodulo,
                user_group_id,
            });
        }

        res.status(200).json('Permisos actualizados correctamente');

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: mensajes.errorInterno,
        });
    }
};


module.exports = {
    getGrupoUsuario,
    getGruposUsuarios,
    grupoUsuarioPost,
    grupoUsuarioPut,
    grupoUsuarioDelete,
    getPermisosModulosByGrupoUsuarioId,
    updatePermisosPost,
    getGruposUsuariosList
}