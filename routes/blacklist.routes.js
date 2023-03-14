const { Router } = require('express');
const { check } = require('express-validator');
const { blackListGet, blackListPost, blackListDelete, blackListGetByClienteId } = require('../controllers/blacklist');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', blackListGetByClienteId);

router.get('/', blackListGet);

router.post('/', [
        check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], blackListPost);

// router.put('/:id', [
//     check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
//     validarCampos
// ], blackListPut);

router.delete('/:id', blackListDelete);

module.exports = router;