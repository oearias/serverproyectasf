const { Router } = require('express');
const { check } = require('express-validator');
const { groupGet, groupsGet, groupPost, groupPut, groupDelete } = require('../controllers/groups');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', groupGet);

router.get('/', groupsGet);

router.post('/', [
        check('nombre', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], groupPost);

router.put('/:id', groupPut);

router.delete('/:id', groupDelete);

module.exports = router;