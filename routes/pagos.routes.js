const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

const { pagoGet, pagosGet, pagoDelete, pagoPut, pagoPost, pagosGetByCriteria, pagosGetByCreditoId } = require('../controllers/pagos');

const router = Router();

router.get('/:id', pagoGet);

router.get('/credito/:id', pagosGetByCreditoId);

router.get('/', pagosGet);

router.get('/:criterio/:palabra', pagosGetByCriteria);

router.post('/', [
        check('credito_id', 'El campo es obligatorio').not().isEmpty(),
        check('fecha', 'El campo es obligatorio').not().isEmpty(),
        check('monto', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], pagoPost);

router.put('/:id', [
    check('observaciones', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], pagoPut);

router.delete('/:id', pagoDelete);



module.exports = router;