const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { zonaGet, zonasGet, zonaPost, 
        zonaPut, zonaDelete, zonasGetBySucursalId, zonasGetByCriteria } = require('../controllers/zonas');

const router = Router();

router.get('/:id', zonaGet);

router.get('/', zonasGet);

router.get('/:criterio/:palabra', zonasGetByCriteria);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('sucursal_id', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], zonaPost);

router.put('/:id', [
        body('nombre').toUpperCase(),
], zonaPut);

router.delete('/:id', zonaDelete);

router.get('/sucursal/:id', zonasGetBySucursalId);

module.exports = router;