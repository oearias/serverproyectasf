const { Router } = require('express');
const { check, body } = require('express-validator');
const { tipoParentescoGet, tipoParentescosGet, tipoParentescoPost, tipoParentescoPut, tipoParentescoDelete } = require('../controllers/tipo_parentesco');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tipoParentescoGet);

router.get('/', tipoParentescosGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tipoParentescoPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
], tipoParentescoPut);

router.delete('/:id', tipoParentescoDelete);

module.exports = router;