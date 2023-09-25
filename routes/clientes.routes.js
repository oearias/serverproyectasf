const { Router } = require('express');
const { check, body} = require('express-validator');
const { clientesGet, clienteGet, clientePost, clientePut, clienteDelete, clientesGetByCriteria, clientesGetTotal, getClientesPaginados } = require('../controllers/clientes');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', clienteGet);

router.get('/', clientesGet);

router.post('/clientes_list', getClientesPaginados);

router.get('/total/total', clientesGetTotal);

router.get('/:criterio/:palabra', clientesGetByCriteria);

router.post('/', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    check('apellido_paterno', 'El campo es obligatorio').not().isEmpty(),
    check('fecha_nacimiento', 'El campo es obligatorio').not().isEmpty(),
    check('agencia_id','El campo es obligatorio').not().isEmpty(),
    check('telefono','El campo es obligatorio').not().isEmpty(),
    check('sexo','El campo es obligatorio').not().isEmpty(),
    body('nombre').toUpperCase(),
    body('apellido_paterno').toUpperCase(),
    body('apellido_materno').toUpperCase(),
    body('curp').toUpperCase(),
    body('rfc').toUpperCase(),
    body('calle').toUpperCase(),
    body('colonia').toUpperCase(),
    body('num_int').toUpperCase(),
    body('num_ext').toUpperCase(),
    body('cruzamientos').toUpperCase(),
    body('referencia').toUpperCase(),
    body('municipio').toUpperCase(),
    body('localidad').toUpperCase(),
    body('estado').toUpperCase(),
    body('email').toLowerCase(),
    validarCampos
], clientePost);

router.put('/:id', [
    check('nombre', 'El campo es obligatorio').not().isEmpty(),
    check('apellido_paterno', 'El campo es obligatorio').not().isEmpty(),
    check('fecha_nacimiento', 'El campo es obligatorio').not().isEmpty(),
    check('agencia_id','El campo es obligatorio').not().isEmpty(),
    check('telefono','El campo es obligatorio').not().isEmpty(),
    check('sexo','El campo es obligatorio').not().isEmpty(),
    body('nombre').toUpperCase(),
    body('apellido_paterno').toUpperCase(),
    body('apellido_materno').toUpperCase(),
    body('curp').toUpperCase(),
    body('rfc').toUpperCase(),
    body('calle').toUpperCase(),
    body('colonia').toUpperCase(),
    body('num_int').toUpperCase(),
    body('num_ext').toUpperCase(),
    body('cruzamientos').toUpperCase(),
    body('referencia').toUpperCase(),
    body('municipio').toUpperCase(),
    body('localidad').toUpperCase(),
    body('estado').toUpperCase(),
    body('email').toLowerCase(),
    validarCampos
], clientePut);

router.delete('/:id', clienteDelete);

module.exports = router;