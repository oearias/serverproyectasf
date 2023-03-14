const { Router } = require('express');
const { check } = require('express-validator');
const { tipoEstatusContratoGet, tipoEstatusContratosGet, tipoEstatusContratoPost, tipoEstatusContratoPut, tipoEstatusContratoDelete } = require('../controllers/tipo_estatus_contrato');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoEstatusContratoGet);

router.get('/', tipoEstatusContratosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], tipoEstatusContratoPost);

router.put('/:id', tipoEstatusContratoPut);

router.delete('/:id', tipoEstatusContratoDelete);

module.exports = router;