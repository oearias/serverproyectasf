const { Router } = require('express');
const { check } = require('express-validator');
const { userRoleGet, userRolesGet, userRolePost, userRolePut, userRoleDelete, userRoleGetByUserId, userRoleGetByDynamicId } = require('../controllers/usuario_role');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

//Devuelve usuarios - roles por user id
//router.get('/:id', userRoleGetByUserId);

router.get('/:id/:criterio', userRoleGetByDynamicId);

router.get('/', userRolesGet);

router.post('/', [
        check('usuario_id', 'El campo es obligatorio').not().isEmpty(),
        check('role_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], userRolePost);

router.put('/:id',[
        check('usuario_id', 'El campo es obligatorio').not().isEmpty(),
        check('role_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
],  userRolePut);

router.delete('/:id', userRoleDelete);

module.exports = router;