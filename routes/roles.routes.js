const { Router } = require('express');
const { check, body } = require('express-validator');
const { roleGet, rolesGet, rolePost, rolePut, roleDelete, rolesGetByUserId } = require('../controllers/role');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', roleGet);

router.get('/', rolesGet);

router.get('/user/:id', rolesGetByUserId);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('descripcion', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('descripcion').toUpperCase(),
        validarCampos
], rolePost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('descripcion', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('descripcion').toUpperCase(),
        validarCampos
],rolePut);

router.delete('/:id', roleDelete);

module.exports = router;