const { Router } = require('express');
const { check, body } = require('express-validator');
const { tipoEstatusCreditoGet, tipoEstatusCreditosGet, tipoEstatusCreditoPost, tipoEstatusCreditoPut, tipoEstatusCreditoDelete } = require('../controllers/tipo_estatus_credito');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoEstatusCreditoGet);

router.get('/', tipoEstatusCreditosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoEstatusCreditoPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos,
],tipoEstatusCreditoPut);

router.delete('/:id', tipoEstatusCreditoDelete);

module.exports = router;