const { Router } = require('express');
const { check, body } = require('express-validator');
const { solicitudCreditoGet, solicitudCreditosGet,
        solicitudCreditoPost, solicitudCreditoDelete, solicitudCreditoPut, solicitudCreditoGetException, solicitudGetByCriteria, solicitudCreditoGetByClienteId, solChangeEstatusAprobadaToDelivery, solicitudCreditosGetTotal, getSolicitudesCreditoPaginados, getSolicitudesParaPresupuesto, getSolicitudesCreditoPorAprobarPaginados, changeEstatusPendingToApproved } = require('../controllers/solicitud_creditos');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', solicitudCreditoGet);

//Solicitudes para presupuesto
router.post('/presupuesto', getSolicitudesParaPresupuesto);

router.get('/total/total', solicitudCreditosGetTotal);

router.get('/exception/:id', solicitudCreditoGetException);

router.get('/cliente/:id', solicitudCreditoGetByClienteId);

router.get('/:criterio/:palabra', solicitudGetByCriteria);

router.get('/', solicitudCreditosGet);

router.post('/solicitudes_credito_list', getSolicitudesCreditoPaginados);

router.post('/solicitudes_to_approve_credito_list', getSolicitudesCreditoPorAprobarPaginados);

router.post('/', [
        //check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        
        body('nombre_contacto1').toUpperCase(),
        body('nombre_contacto2').toUpperCase(),
        check('telefono_contacto1', 'El campo es obligatorio').not().isEmpty(),
        check('telefono_contacto1', 'El teléfono de la referencia 1 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        check('telefono_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('telefono_contacto2', 'El teléfono de la referencia 2 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        check('direccion_contacto1', 'El campo es obligatorio').not().isEmpty(),
        check('direccion_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_solicitud', 'La fecha de la solicitud es obligatorio').not().isEmpty(),
        check('monto', 'El campo monto es obligatorio').not().isEmpty(),
        check('tipo_identificacion_id', 'El tipo de identificacion es obligatorio').not().isEmpty(),
        check('num_identificacion', 'El número de identificación es obligatorio').not().isEmpty(),
        check('ocupacion_id', 'El campo tipo de Ocupación es obligatorio').not().isEmpty(),
        check('estatus_sol_id', 'El campo es obligatorio').not().isEmpty(),
        check('agencia_id', 'El campo es obligatorio').not().isEmpty(),
        check('ingreso_mensual', 'El ingreso mensual es obligatorio').not().isEmpty(),
        body('vivienda_propia').toUpperCase(),
        body('cliente.nombre').toUpperCase(),
        body('cliente.apellido_paterno').toUpperCase(),
        body('cliente.apellido_materno').toUpperCase(),
        body('cliente.email').toLowerCase(),
        body('cliente.calle').toUpperCase(),
        body('cliente.num_ext').toUpperCase(),
        body('cliente.num_int').toUpperCase(),
        body('cliente.municipio').toUpperCase(),
        body('cliente.localidad').toUpperCase(),
        body('cliente.estado').toUpperCase(),
        body('cliente.curp').toUpperCase(),
        body('cliente.rfc').toUpperCase(),
        body('calle').toUpperCase(),
        body('num_ext').toUpperCase(),
        body('cruzamientos').toUpperCase(),
        body('referencia').toUpperCase(),
        body('municipio').toUpperCase(),
        body('localidad').toUpperCase(),
        body('estado').toUpperCase(),
        body('color_casa').toUpperCase(),
        body('color_porton').toUpperCase(),
        validarCampos
], solicitudCreditoPost);

router.put('/:id', [
        check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        check('telefono_contacto1', 'El campo es obligatorio').not().isEmpty(),
        check('telefono_contacto1', 'El teléfono de la referencia 1 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        body('nombre_contacto1').toUpperCase(),
        check('telefono_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('telefono_contacto2', 'El teléfono de la referencia 2 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        body('nombre_contacto2').toUpperCase(),
        check('direccion_contacto1', 'El campo es obligatorio').not().isEmpty(),
        check('direccion_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_solicitud', 'La fecha de la solicitud es obligatorio').not().isEmpty(),
        check('monto', 'El campo monto es obligatorio').not().isEmpty(),
        check('tipo_identificacion_id', 'El tipo de identificacion es obligatorio').not().isEmpty(),
        check('num_identificacion', 'El número de identificación es obligatorio').not().isEmpty(),
        check('ocupacion_id', 'El campo tipo de Ocupación es obligatorio').not().isEmpty(),
        check('estatus_sol_id', 'El campo es obligatorio').not().isEmpty(),
        check('agencia_id', 'El campo es obligatorio').not().isEmpty(),
        check('ingreso_mensual', 'El ingreso mensual es obligatorio').not().isEmpty(),
        body('vivienda_propia').toUpperCase(),
        body('cliente.nombre').toUpperCase(),
        body('cliente.apellido_paterno').toUpperCase(),
        body('cliente.apellido_materno').toUpperCase(),
        body('cliente.email').toLowerCase(),
        body('cliente.calle').toUpperCase(),
        body('cliente.num_ext').toUpperCase(),
        body('cliente.num_int').toUpperCase(),
        body('cliente.municipio').toUpperCase(),
        body('cliente.localidad').toUpperCase(),
        body('cliente.estado').toUpperCase(),
        body('cliente.curp').toUpperCase(),
        body('cliente.rfc').toUpperCase(),
        body('calle').toUpperCase(),
        body('num_ext').toUpperCase(),
        body('cruzamientos').toUpperCase(),
        body('referencia').toUpperCase(),
        body('municipio').toUpperCase(),
        body('localidad').toUpperCase(),
        body('estado').toUpperCase(),
        body('color_casa').toUpperCase(),
        body('color_porton').toUpperCase(),
        validarCampos
], solicitudCreditoPut);

router.delete('/:id', solicitudCreditoDelete);

router.patch('/items', solChangeEstatusAprobadaToDelivery);

router.patch('/approve_solicitudes', changeEstatusPendingToApproved);

module.exports = router;