const { Router } = require('express');
const { check } = require('express-validator');
const { servicioGet, serviciosGet, servicioPost, servicioPut, serviciosDelete } = require('../controllers/servicios');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', servicioGet);

router.get('/', serviciosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], servicioPost);

router.put('/:id', servicioPut);

router.delete('/:id', serviciosDelete);

module.exports = router;