const express = require('express');
const cors = require('cors');
const paths = require('../routes/paths.routes');
const path = require('path')

class Server {

    constructor() {

        this.app = express();
        this.port = process.env.PORT;

        this.middlewares();
        this.routes();

    }

    middlewares() {

        //this.app.use(cors());

        //Configuración CORS
        this.app.use(cors({
            origin: 'https://system-proyectasfweb.com', 
            //origin: 'http://192.168.0.20:4200', //TODO: Este se tiene que quitar despues de las pruebas
            methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
            allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
            credentials: true,
        }));

        this.app.use(express.json());

        //Handlebars
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'hbs');

        this.app.use(express.urlencoded({ extended: true }));

        //Directorio público
        this.app.use(express.static('public'));

    }

    routes() {

        this.app.use(paths.auth, require('../routes/auth.routes'));

        this.app.use(paths.agencias, require('../routes/agencias.routes'));
        this.app.use(paths.balances, require('../routes/balances.routes'));
        this.app.use(paths.blacklist, require('../routes/blacklist.routes'));
        this.app.use(paths.clientes, require('../routes/clientes.routes'));
        this.app.use(paths.clienteParentela, require('../routes/cliente_parentela.routes'));
        this.app.use(paths.creditos, require('../routes/creditos.routes'));
        this.app.use(paths.colonias, require('../routes/colonias.routes'));
        this.app.use(paths.direcciones, require('../routes/direcciones.routes'));
        this.app.use(paths.eventos, require('../routes/solicitud_eventos.routes'));
        this.app.use(paths.groups, require('../routes/groups.routes'))
        this.app.use(paths.ocupaciones, require('../routes/ocupaciones.routes'));
        this.app.use(paths.pagos, require('../routes/pagos.routes'));
        this.app.use(paths.roles, require('../routes/roles.routes'));
        this.app.use(paths.semanas, require('../routes/semanas.routes'));
        this.app.use(paths.sucursales, require('../routes/sucursales.routes'));
        this.app.use(paths.servicios, require('../routes/servicios.routes'));
        this.app.use(paths.solicitudes, require('../routes/solicitud_credito.routes'));

        //tipos
        this.app.use(paths.tipoCliente, require('../routes/tipo_cliente.routes'));
        this.app.use(paths.tipoContrato, require('../routes/tipo_contrato.routes'));
        this.app.use(paths.tipoCredito, require('../routes/tipo_credito.routes'));
        this.app.use(paths.tipoEmpleo, require('../routes/tipo_empleo.routes'));
        this.app.use(paths.tipoEstatusContrato, require('../routes/tipo_estatus_contrato.routes'));
        this.app.use(paths.tipoEstatusCredito, require('../routes/tipo_estatus_credito.routes'));
        this.app.use(paths.tipoEstatusSolicitud, require('../routes/tipo_estatus_solicitud.routes'));
        this.app.use(paths.tipofuenteFinanciamiento, require('../routes/tipo_fuente_financiamiento.routes'));
        this.app.use(paths.identificacion, require('../routes/tipo_identificacion.routes'));
        this.app.use(paths.tipoParentesco, require('../routes/tipo_parentesco.routes'));

        this.app.use(paths.montos, require('../routes/montos.routes'));
        this.app.use(paths.tarifas, require('../routes/tarifas.routes'));
        this.app.use(paths.userGroup, require('../routes/usuario_group.routes'));
        this.app.use(paths.userRole, require('../routes/usuario_role.routes'));
        this.app.use(paths.groupRole, require('../routes/group_role.routes'));
        this.app.use(paths.usuarios, require('../routes/usuarios.routes'));
        this.app.use(paths.zonas, require('../routes/zonas.routes'));
        this.app.use(paths.tipoAsentamiento, require('../routes/tipo_asentamiento.routes'));
    }

    listen() {

        const fechaHoy = new Date()

        this.app.listen(process.env.PORT, () => {
            console.log('Server running on port:', this.port);

        })
    }
}

module.exports = Server;