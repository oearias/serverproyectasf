const { Router } = require('express');
const { check } = require('express-validator');
const { tipoCreditoGet, tipoCreditosGet, tipoCreditoPost, tipoCreditoPut, tipoCreditoDelete } = require('../controllers/tipo_credito');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoCreditoGet);

router.get('/', tipoCreditosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], tipoCreditoPost);

router.put('/:id', tipoCreditoPut);

router.delete('/:id', tipoCreditoDelete);

module.exports = router;