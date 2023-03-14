const { Router } = require('express');
const { check } = require('express-validator');
const { tipoEstatusSolicitudGet, tipoEstatusSolicitudesGet, tipoEstatusSolicitudPut, tipoEstatusSolicitudPost, tipoEstatusSolicitudDelete } = require('../controllers/tipo_estatus_solicitud');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoEstatusSolicitudGet);

router.get('/', tipoEstatusSolicitudesGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], tipoEstatusSolicitudPost);

router.put('/:id', tipoEstatusSolicitudPut);

router.delete('/:id', tipoEstatusSolicitudDelete);

module.exports = router;