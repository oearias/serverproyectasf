const { Router } = require('express');
const { check, body } = require('express-validator');
const { solicitudCreditoGet, solicitudCreditosGet,
        solicitudCreditoPost, solicitudCreditoDelete, solicitudCreditoPut, solicitudCreditoGetException, solicitudGetByCriteria, solicitudCreditoGetByClienteId, solChangeEstatusAprobadaToDelivery, solicitudCreditosGetTotal, getSolicitudesCreditoPaginados, getSolicitudesParaPresupuesto, getSolicitudesCreditoPorAprobarPaginados, changeEstatusPendingToApproved, getSolicitudesToModifyPaginados } = require('../controllers/solicitud_creditos');
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

router.post('/solicitudes_to_modify_list', getSolicitudesToModifyPaginados);

router.post('/', [
        //check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        
        body('nombre_contacto1').trim().toUpperCase(),
        body('nombre_contacto2').trim().toUpperCase(),
        // check('telefono_contacto1', 'El campo es obligatorio').not().isEmpty(),
        // check('telefono_contacto1', 'El teléfono de la referencia 1 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        // check('telefono_contacto2', 'El campo es obligatorio').not().isEmpty(),
        // check('telefono_contacto2', 'El teléfono de la referencia 2 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        // check('direccion_contacto1', 'El campo es obligatorio').not().isEmpty(),
        // check('direccion_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_solicitud', 'La fecha de la solicitud es obligatorio').not().isEmpty(),
        //check('monto', 'El campo monto es obligatorio').not().isEmpty(),
        // check('tipo_identificacion_id', 'El tipo de identificacion es obligatorio').not().isEmpty(),
        // check('num_identificacion', 'El número de identificación es obligatorio').not().isEmpty(),
        // check('ocupacion_id', 'El campo tipo de Ocupación es obligatorio').not().isEmpty(),
        check('estatus_sol_id', 'El campo es obligatorio').not().isEmpty(),
        check('agencia_id', 'El campo es obligatorio').not().isEmpty(),
        // check('ingreso_mensual', 'El ingreso mensual es obligatorio').not().isEmpty(),
        body('vivienda_propia').toUpperCase(),
        body('cliente.nombre').trim().toUpperCase(),
        body('cliente.apellido_paterno').trim().toUpperCase(),
        body('cliente.apellido_materno').trim().toUpperCase(),
        body('cliente.email').trim().toLowerCase(),
        body('cliente.calle').trim().toUpperCase(),
        body('cliente.num_ext').trim().toUpperCase(),
        body('cliente.num_int').trim().toUpperCase(),
        body('cliente.municipio').trim().toUpperCase(),
        body('cliente.localidad').trim().toUpperCase(),
        body('cliente.estado').trim().toUpperCase(),
        body('cliente.curp').toUpperCase(),
        body('cliente.rfc').trim().toUpperCase(),
        body('calle').trim().toUpperCase(),
        body('num_ext').trim().toUpperCase(),
        body('cruzamientos').trim().toUpperCase(),
        body('referencia').trim().toUpperCase(),
        body('municipio').trim().toUpperCase(),
        body('localidad').trim().toUpperCase(),
        body('estado').trim().toUpperCase(),
        body('color_casa').trim().toUpperCase(),
        body('color_porton').trim().toUpperCase(),
        validarCampos
], solicitudCreditoPost);

router.put('/:id', [
        check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        //check('telefono_contacto1', 'El campo es obligatorio').not().isEmpty(),
        //check('telefono_contacto1', 'El teléfono de la referencia 1 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        body('nombre_contacto1').trim().toUpperCase(),
        body('nombre_contacto2').trim().toUpperCase(),
        //check('telefono_contacto2', 'El campo es obligatorio').not().isEmpty(),
        //check('telefono_contacto2', 'El teléfono de la referencia 2 debe tener al menos 10 dígitos').isLength({ min: 10 }),
        //check('direccion_contacto1', 'El campo es obligatorio').not().isEmpty(),
        //check('direccion_contacto2', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_solicitud', 'La fecha de la solicitud es obligatorio').not().isEmpty(),
        //check('monto', 'El campo monto es obligatorio').not().isEmpty(),
        //check('tipo_identificacion_id', 'El tipo de identificacion es obligatorio').not().isEmpty(),
        //check('num_identificacion', 'El número de identificación es obligatorio').not().isEmpty(),
        //check('ocupacion_id', 'El campo tipo de Ocupación es obligatorio').not().isEmpty(),
        check('estatus_sol_id', 'El campo es obligatorio').not().isEmpty(),
        check('agencia_id', 'El campo es obligatorio').not().isEmpty(),
        //check('ingreso_mensual', 'El ingreso mensual es obligatorio').not().isEmpty(),
        body('vivienda_propia').toUpperCase(),
        body('cliente.nombre').trim().toUpperCase(),
        body('cliente.apellido_paterno').trim().toUpperCase(),
        body('cliente.apellido_materno').trim().toUpperCase(),
        body('cliente.email').trim().toLowerCase(),
        body('cliente.calle').trim().toUpperCase(),
        body('cliente.num_ext').trim().toUpperCase(),
        body('cliente.num_int').trim().toUpperCase(),
        body('cliente.municipio').trim().toUpperCase(),
        body('cliente.localidad').trim().toUpperCase(),
        body('cliente.estado').trim().toUpperCase(),
        body('cliente.curp').trim().toUpperCase(),
        body('cliente.rfc').trim().toUpperCase(),
        body('aval.nombre').trim().toUpperCase(),
        body('aval.apellido_paterno').trim().toUpperCase(),
        body('aval.apellido_materno').trim().toUpperCase(),
        body('aval.calle').trim().toUpperCase(),
        body('negocio.nombre').toUpperCase(),
        body('negocio.giro').trim().toUpperCase(),
        body('negocio.calle').toUpperCase(),
        body('calle').trim().toUpperCase(),
        body('num_ext').trim().toUpperCase(),
        body('cruzamientos').toUpperCase(),
        body('referencia').trim().toUpperCase(),
        body('municipio').trim().toUpperCase(),
        body('localidad').trim().toUpperCase(),
        body('estado').trim().toUpperCase(),
        body('color_casa').trim().toUpperCase(),
        body('color_porton').trim().toUpperCase(),
        validarCampos
], solicitudCreditoPut);

router.delete('/:id', solicitudCreditoDelete);

router.patch('/items', solChangeEstatusAprobadaToDelivery);

router.patch('/approve_solicitudes', changeEstatusPendingToApproved);

module.exports = router;