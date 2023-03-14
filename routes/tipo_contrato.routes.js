const { Router } = require('express');
const { check, body } = require('express-validator');
const { tipoContratoGet, tipoContratosGet, tipoContratoPost, tipoContratoPut, tipoContratoDelete } = require('../controllers/tipo_contrato');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoContratoGet);

router.get('/', tipoContratosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoContratoPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoContratoPut);

router.delete('/:id', tipoContratoDelete);

module.exports = router;