const { Router } = require('express');
const { check } = require('express-validator');
const { tipoClienteGet, tipoClientesGet, tipoClientePost, tipoClientePut, tipoClienteDelete } = require('../controllers/tipo_cliente');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoClienteGet);

router.get('/', tipoClientesGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], tipoClientePost);

router.put('/:id', tipoClientePut);

router.delete('/:id', tipoClienteDelete);

module.exports = router;