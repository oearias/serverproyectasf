const { Router } = require('express');
const { check, body } = require('express-validator');

const { tipoFuenteFinanciamientoGet,
    tipoFuenteFinanciamientosGet,
    tipoFuenteFinanciamientoPost,
    tipoFuenteFinanciamientoPut,
    tipoFuenteFinanciamientoDelete } = require('../controllers/tipo_fuente_financiamiento');

const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoFuenteFinanciamientoGet);

router.get('/', tipoFuenteFinanciamientosGet);

router.post('/', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    body('nombre').toUpperCase(),
    validarCampos
], tipoFuenteFinanciamientoPost);

router.put('/:id', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    body('nombre').toUpperCase(),
], tipoFuenteFinanciamientoPut);

router.delete('/:id', tipoFuenteFinanciamientoDelete);

module.exports = router;