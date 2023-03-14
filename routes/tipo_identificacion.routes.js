const { Router } = require('express');
const { check, body } = require('express-validator');
const { tipoIdentificacionGet, tipoIdentificacionesGet, tipoIdentificacionPost, tipoIdentificacionPut, tipoIdentificacionDelete } = require('../controllers/tipo_identificacion');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoIdentificacionGet);

router.get('/', tipoIdentificacionesGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoIdentificacionPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
],tipoIdentificacionPut);

router.delete('/:id', tipoIdentificacionDelete);

module.exports = router;