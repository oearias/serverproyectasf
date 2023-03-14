const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { sucursalesGet, sucursalDelete, 
        sucursalPut, sucursalPost, sucursalGet, sucursalesGetByCriteria } = require('../controllers/sucursales');

const router = Router();

router.get('/:id', sucursalGet);

router.get('/', sucursalesGet);

router.get('/:criterio/:palabra', sucursalesGetByCriteria);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('clave', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('clave').toUpperCase(),
        validarCampos
], sucursalPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('clave', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('clave').toUpperCase(),
], sucursalPut);

router.delete('/:id', sucursalDelete);

module.exports = router;