const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { ocupacionGet, ocupacionesGet, ocupacionPut, ocupacionPost, ocupacionDelete } = require('../controllers/ocupaciones');

const router = Router();

router.get('/:id', ocupacionGet);

router.get('/', ocupacionesGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], ocupacionPost);

router.put('/:id', [
        body('nombre').toUpperCase(),
], ocupacionPut);

router.delete('/:id', ocupacionDelete);

module.exports = router;