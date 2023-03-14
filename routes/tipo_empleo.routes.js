const { Router } = require('express');    
const { check, body } = require('express-validator');
const { tipoEmpleoGet, tipoEmpleosGet, 
        tipoEmpleoPost, tipoEmpleoPut, tipoEmpleoDelete } = require('../controllers/tipo_empleo');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoEmpleoGet);

router.get('/', tipoEmpleosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoEmpleoPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
], tipoEmpleoPut);

router.delete('/:id', tipoEmpleoDelete);

module.exports = router;