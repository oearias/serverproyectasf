const { Router } = require('express');
const { check, body } = require('express-validator');
const { usuarioGet, usuariosGet, usuarioPost, usuarioPut, usuarioDelete, usuarioChangePassword, usuariosGetByCriteria } = require('../controllers/usuarios');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', usuarioGet);

router.get('/', usuariosGet);

router.get('/:criterio/:palabra', usuariosGetByCriteria);

router.post('/', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    check('apellido_paterno', 'El campo es obligatorio').not().isEmpty(),
    check('email', 'El campo es obligatorio').not().isEmpty(),
    check('email','El email debe contener un formato válido').isEmail(),
    check('password', 'El campo es obligatorio').not().isEmpty(),
    check('password','La contraseña debe tener al menos 6 caracteres').isLength({min:6}),
    body('nombre').toUpperCase(),
    body('apellido_paterno').toUpperCase(),
    body('apellido_materno').toUpperCase(),
    body('email').toLowerCase(),
    validarCampos
], usuarioPost);

router.put('/:id', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    check('apellido_paterno', 'El campo es obligatorio').not().isEmpty(),
    check('email', 'El campo es obligatorio').not().isEmpty(),
    check('email','El email debe contener un formato válido').isEmail(),
    check('password', 'El campo es obligatorio').not().isEmpty(),
    check('password','La contraseña debe tener al menos 6 caracteres').isLength({min:6}),
    body('nombre').toUpperCase(),
    body('apellido_paterno').toUpperCase(),
    body('apellido_materno').toUpperCase(),
    body('email').toLowerCase(),
    validarCampos
], usuarioPut);

router.put('/resetPassword/:id', [
    check('password', 'El campo es obligatorio').not().isEmpty(),
    check('password','La contraseña debe tener al menos 6 caracteres').isLength({min:6}),
    validarCampos
], usuarioChangePassword);

router.delete('/:id', usuarioDelete);

module.exports = router;