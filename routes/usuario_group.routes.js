const { Router } = require('express');
const { check } = require('express-validator');
const { userGroupsGet, userGroupGetByDynamicId, userGroupPost, userGroupPut, userGroupDelete } = require('../controllers/usuario_group');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id/:criterio', userGroupGetByDynamicId);

router.get('/', userGroupsGet);

router.post('/', [
        check('usuario_id', 'El campo es obligatorio').not().isEmpty(),
        check('group_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], userGroupPost);

router.put('/:id', [
    check('usuario_id', 'El campo es obligatorio').not().isEmpty(),
    check('group_id', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], userGroupPut);

router.delete('/:id', userGroupDelete);

module.exports = router;