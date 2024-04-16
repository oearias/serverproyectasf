const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { agenciaGet, agenciasGet, agenciaPost, 
        agenciaPut, agenciaDelete, agenciasGetByZonaId, 
        agenciasGetByCriteria } = require('../controllers/agencias');

const router = Router();

router.get('/:id', agenciaGet);

router.get('/', agenciasGet);

router.get('/:criterio/:palabra', agenciasGetByCriteria);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('zona_id', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], agenciaPost);

router.put('/:id', [
        body('nombre').toUpperCase(),
], agenciaPut);

router.delete('/:id', agenciaDelete);

router.post('/zona/:id', agenciasGetByZonaId);

module.exports = router;