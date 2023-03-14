const { Router } = require('express');    
const { check, body } = require('express-validator');
const { tipoAsentamientoGet, tipoAsentamientosGet, tipoAsentamientoPost, tipoAsentamientoPut, tipoAsentamientoDelete } = require('../controllers/tipo_asentamiento');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoAsentamientoGet);

router.get('/', tipoAsentamientosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('abreviatura', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('abreviatura').toUpperCase(),
        validarCampos
], tipoAsentamientoPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('abreviatura', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        body('abreviatura').toUpperCase(),
], tipoAsentamientoPut);

router.delete('/:id', tipoAsentamientoDelete);

module.exports = router;