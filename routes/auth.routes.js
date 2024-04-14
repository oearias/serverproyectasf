const { Router } = require('express');
const { check } = require('express-validator');
const { login, logout } = require('../controllers/auth');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.post('/login', [
    // check('email', 'El email es obligatorio').isEmail(),
    check('email', 'El usuario es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], login);

router.post('/logout', logout);


module.exports = router;