const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { getGruposUsuarios, grupoUsuarioPost, grupoUsuarioPut, getGrupoUsuario, grupoUsuarioDelete, getPermisosModulosByGrupoUsuarioId, updatePermisosPost, getGruposUsuariosList } = require('../controllers/grupos_usuarios');

const router = Router();

router.get('/:id', getGrupoUsuario);

router.post('/grupo_usuario_list', getGruposUsuarios);

//Grupos de usuarios sin paginar
router.post('/grupos_usuarios_list', getGruposUsuariosList);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('descripcion', 'El campo es obligatorio').not().isEmpty(),
        // body('nombre').toUpperCase(),
        // body('descripcion').toUpperCase(),
        validarCampos
], grupoUsuarioPost);

router.put('/:id', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    check('descripcion', 'El campo es obligatorio').not().isEmpty(),
    // body('nombre').toUpperCase(),
    // body('descripcion').toUpperCase(),
    validarCampos
], grupoUsuarioPut);

router.delete('/:id', grupoUsuarioDelete);

router.get('/modulos_user_group/:id', getPermisosModulosByGrupoUsuarioId);

router.post('/update_permisos', [], updatePermisosPost);

module.exports = router;