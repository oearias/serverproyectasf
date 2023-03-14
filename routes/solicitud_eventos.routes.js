const { Router } = require('express');
const { eventosGet } = require('../controllers/solicitud_eventos');


const router = Router();

router.get('/:id', eventosGet);

module.exports = router;