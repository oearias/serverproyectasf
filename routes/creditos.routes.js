const { Router } = require('express');
const { check } = require('express-validator');
const { creditoGet, creditosGet, creditoPost, creditoPut, creditoDelete, 
        amortizacionGet, printContrato, printAmortizacion, printAllDoc, printTarjetaPagos, amortizacionPost, 
        setFechaCreditosMasivos, printEntregasCredito, inversionPositivaDelete, creditoGetByCriteria, printContratosMasivos, printCreditos, creditosGetOptimized, creditosGetTotal, get_creditos_paginados, getCreditosPaginados, getCreditosLimitados, getCreditoOptimizado, getCreditosByClienteId, getCreditosInversionPositivaPaginados, getCreditosLimitadosInversionPositiva, printReporteCartas, getCreditosProgramacionEntregaPaginados} = require('../controllers/creditos');
const { createCreditosMasivos } = require('../controllers/solicitud_creditos');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/:id', creditoGet);

router.post('/credito', getCreditoOptimizado);

router.get('/', creditosGetOptimized);

router.post('/creditos_list', getCreditosPaginados);

router.post('/creditos_list_limit', getCreditosLimitados);

router.post('/creditos_cliente', getCreditosByClienteId);

router.post('/creditos_list/inversion_positiva', getCreditosInversionPositivaPaginados);

router.post('/creditos_list_limit/inversion_positiva', getCreditosLimitadosInversionPositiva);

router.post('/creditos_list/programacion_entrega', getCreditosProgramacionEntregaPaginados);

router.get('/total/total', creditosGetTotal);

router.post('/', [
        check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        check('tipo_credito_id', 'El campo es obligatorio').not().isEmpty(),
        // check('tipo_contrato_id', 'El campo es obligatorio').not().isEmpty(),
        check('estatus_credito_id', 'El campo es obligatorio').not().isEmpty(),
        check('monto_otorgado', 'El campo es obligatorio').not().isEmpty(),
        check('monto_total', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_creacion', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_inicio_prog', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_fin_prog', 'El campo es obligatorio').not().isEmpty(),
        // check('fecha_entrega_prog', 'El campo es obligatorio').not().isEmpty(),
        //check('fuente_financ_id', 'El campo es obligatorio').not().isEmpty(),
        check('tarifa_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
], creditoPost);

router.put('/:id', [
        check('cliente_id', 'El campo es obligatorio').not().isEmpty(),
        check('tipo_credito_id', 'El campo es obligatorio').not().isEmpty(),
        // check('tipo_contrato_id', 'El campo es obligatorio').not().isEmpty(),
        check('estatus_credito_id', 'El campo es obligatorio').not().isEmpty(),
        check('monto_otorgado', 'El campo es obligatorio').not().isEmpty(),
        check('monto_total', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_creacion', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_inicio_prog', 'El campo es obligatorio').not().isEmpty(),
        check('fecha_fin_prog', 'El campo es obligatorio').not().isEmpty(),
        // check('fecha_entrega_prog', 'El campo es obligatorio').not().isEmpty(),
        //check('fuente_financ_id', 'El campo es obligatorio').not().isEmpty(),
        check('tarifa_id', 'El campo es obligatorio').not().isEmpty(),
        validarCampos
],creditoPut);

router.delete('/:id', creditoDelete);

router.get('/search/:criterio/:palabra', creditoGetByCriteria);

router.get('/amortizacion/:id', amortizacionGet);

router.post('/amortizacion/:id', amortizacionPost);

router.post('/print/:id', printContrato);

router.post('/print/reporte_cartas/:semana_id', printReporteCartas);

router.patch('/print/creditos',printCreditos);

router.post('/print/amortizacion/:id', printAmortizacion);

router.post('/print/tarjeta/:id', printTarjetaPagos);

router.post('/print/allDoc/:id', printAllDoc); //COMPARE

router.patch('/creditosMasivos', createCreditosMasivos);

router.patch('/print/contratosMasivos', printContratosMasivos); //COMPARE

router.patch('/items', setFechaCreditosMasivos);

router.post('/print/reporteEntregaCredito/:id', printEntregasCredito);

router.patch('/inversion/:id',creditoPut);

router.patch('/deleteInversion/:id',inversionPositivaDelete);

module.exports = router;