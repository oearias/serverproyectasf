const { Router } = require('express');
const { check, body } = require('express-validator');
const { tarifaGet, tarifasGet, tarifaPost, tarifaDelete, tarifaPut, tarifasActivasGet, getTarifasPaginadas } = require('../controllers/tarifas');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', tarifaGet);

router.get('/', tarifasGet);

router.post('/list', tarifasActivasGet);
router.post('/tarifas_list', getTarifasPaginadas);

router.post('/', [
        check('num_semanas', 'El número de semanas es obligatorio').not().isEmpty(),
        //check('cociente', 'El cociente es obligatorio').not().isEmpty(),
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
], tarifaPost);

router.put('/:id', [
        check('num_semanas', 'El número de semanas es obligatorio').not().isEmpty(),
        //check('cociente', 'El cociente es obligatorio').not().isEmpty(),
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        body('nombre').toUpperCase(),
        validarCampos
],tarifaPut);

router.delete('/:id', tarifaDelete);

module.exports = router;