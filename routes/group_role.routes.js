const { Router } = require('express');
const { check } = require('express-validator');
const { groupRolePost, groupRolesGet, groupRoleGetByDynamicId, groupRolePut, groupRoleDelete } = require('../controllers/group_role');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id/:criterio', groupRoleGetByDynamicId);

router.get('/', groupRolesGet);

router.post('/', [
        check('group_id', 'El campo es obligatorio').not().isEmpty(),
        check('role_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], groupRolePost);

router.put('/:id',[
        check('group_id', 'El campo es obligatorio').not().isEmpty(),
        check('role_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
],  groupRolePut);

router.delete('/:id', groupRoleDelete);

module.exports = router;