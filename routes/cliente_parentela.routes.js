const { Router } = require('express');
const { check } = require('express-validator');
const { parentelaGetByClienteId,
        parentelaPutByClienteId,
        parentelaPostArray, parentelaDelete } = require('../controllers/cliente_parentela');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', parentelaGetByClienteId);

router.post('/:id', [
    validarCampos
], parentelaPostArray);

router.put('/:id', [
    validarCampos
], parentelaPutByClienteId);

router.delete('/:id', [
    validarCampos
], parentelaDelete);

module.exports = router;