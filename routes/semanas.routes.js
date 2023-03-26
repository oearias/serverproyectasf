const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { semanaGet, semanasGet, semanasGetByCriteria, semanaPost, semanaDelete, semanaPut, yearPost } = require('../controllers/semanas');

const router = Router();

router.get('/:id', semanaGet);

router.get('/', semanasGet);

router.get('/:criterio/:palabra', semanasGetByCriteria);

router.post('/', [
    check('fecha_inicio', 'El campo es obligatorio').not().isEmpty(),
    check('fecha_fin', 'El campo es obligatorio').not().isEmpty(),
    check('weekyear', 'El campo es obligatorio').not().isEmpty(),
    check('year', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], semanaPost);

router.put('/:id', [
    check('fecha_inicio', 'El campo es obligatorio').not().isEmpty(),
    check('fecha_fin', 'El campo es obligatorio').not().isEmpty(),
    check('weekyear', 'El campo es obligatorio').not().isEmpty(),
    check('year', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], semanaPut);

router.delete('/:id', semanaDelete);

router.post('/createYear', [
    check('fecha_inicio', 'El campo es obligatorio').not().isEmpty(),
    check('num_semanas', 'El campo es obligatorio').not().isEmpty(),
    check('year', 'El campo es obligatorio').not().isEmpty(),
    validarCampos
], yearPost);

module.exports = router;