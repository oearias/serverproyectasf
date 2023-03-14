const { Router } = require('express');
const { check, body } = require('express-validator');
const { montoGet, montosGet, montoPut, montoDelete, montoPost } = require('../controllers/montos');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', montoGet);

router.get('/', montosGet);

router.post('/', [
        check('monto', 'El campo es obligatorio').not().isEmpty(),
        check('tarifa_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], montoPost);

router.put('/:id', [
    check('monto', 'El campo es obligatorio').not().isEmpty(),
    check('tarifa_id', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], montoPut);

router.delete('/:id', montoDelete);


module.exports = router;