const { Router } = require('express');
const { check } = require('express-validator');
const { direccionGet, direccionesGet,
    direccionPost, direccionPut, direccionDelete
} = require('../controllers/direcciones');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', direccionGet);

router.get('/', direccionesGet);

router.post('/', [
    check('calle', 'El campo es obligatorio').not().isEmpty(),
    check('colonia_id', 'El campo es obligatorio').not().isEmpty(),
    check('num_ext', 'El campo es obligatorio').not().isEmpty(),
    check('municipio', 'El campo es obligatorio').not().isEmpty(),
    check('estado', 'El campo es obligatorio').not().isEmpty(),
    check('localidad', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], direccionPost);

router.put('/:id', [
    check('calle', 'El campo es obligatorio').not().isEmpty(),
    check('colonia_id', 'El campo es obligatorio').not().isEmpty(),
    check('num_ext', 'El campo es obligatorio').not().isEmpty(),
    check('municipio', 'El campo es obligatorio').not().isEmpty(),
    check('estado', 'El campo es obligatorio').not().isEmpty(),
    check('localidad', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], direccionPut);

router.delete('/:id', direccionDelete);

module.exports = router;