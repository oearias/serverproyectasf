const { Router } = require('express');
const { check, body } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { balanceGet } = require('../controllers/balances');

const router = Router();

router.get('/:id', balanceGet);

module.exports = router;