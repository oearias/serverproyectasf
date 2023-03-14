const { Router } = require('express');
const { check, body } = require('express-validator');
const { coloniaGet, coloniasGet, coloniaPost, coloniaPut, coloniaDelete, coloniasGetByCriteria } = require('../controllers/colonias');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', coloniaGet);

router.get('/', coloniasGet);

router.get('/:criterio/:palabra', coloniasGetByCriteria);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('cp', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], coloniaPost);

router.put('/:id', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        check('cp', 'El campo es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
], coloniaPut);

router.delete('/:id', coloniaDelete);

module.exports = router;