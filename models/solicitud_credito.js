const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const Cliente = require('./cliente');
const TipoIdentificacion = require('./tipo_identificacion');
const TipoEstatusSolicitud = require('./tipo_estatus_solicitud');
const TipoEmpleo = require('./tipo_empleo');
const Agencia = require('./agencia');
const Parentesco = require('./parentesco');
const Tarifa = require('./tarifa');
const Ocupacion = require('./ocupacion');

const SolicitudCredito = sequelize.define('SolicitudCredito', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cliente_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Cliente',
            key: 'id'
        }
    },
    aprobado_user_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'User',
            key: 'id'
        }
    },
    fecha_aprobacion:{
        type: Sequelize.DATE,
    },
    telefono_contacto1: {
        type: Sequelize.STRING,
        validate: {
            is: /^[0-9]+$/i, // Validación para asegurarte de que solo contenga dígitos
        }
    },
    telefono_contacto2: {
        type: Sequelize.STRING,
        validate: {
            is: /^[0-9]+$/i, // Validación para asegurarte de que solo contenga dígitos
        }
    },
    fecha_solicitud:{
        type: Sequelize.DATE,
    },
    monto:{
        type: Sequelize.FLOAT,
    },
    tipo_identificacion_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoIdentificacion',
            key: 'id'
        }
    },
    vivienda: {
        type: Sequelize.STRING,
    },
    ocupacion_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Ocupacion',
            key: 'id'
        }
    },
    estatus_sol_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoEstatusSolicitud',
            key: 'id'
        }
    },
    num_dependientes: {
        type: Sequelize.INTEGER,
    },
    tiempo_vivienda_años: {
        type: Sequelize.INTEGER,
    },
    tiempo_vivienda_meses: {
        type: Sequelize.INTEGER,
    },
    tiempo_empleo_años: {
        type: Sequelize.INTEGER,
    },
    tiempo_empleo_meses: {
        type: Sequelize.INTEGER,
    },
    agencia_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Agencia',
            key: 'id'
        }
    },
    fecha_creacion: {
        type: Sequelize.DATE,
    },
    num_identificacion: {
        type: Sequelize.STRING,
    },
    colonia_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Colonia',
            key: 'id'
        }
    },
    calle: {
        type: Sequelize.STRING,
    },
    localidad: {
        type: Sequelize.STRING,
    },
    municipio: {
        type: Sequelize.STRING,
    },
    estado: {
        type: Sequelize.STRING,
    },
    tipo_empleo_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'TipoEmpleo',
            key: 'id'
        }
    },
    nombre_contacto1: {
        type: Sequelize.STRING,
    },
    nombre_contacto2: {
        type: Sequelize.STRING,
    },
    tarifa_id:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Tarifa',
            key: 'id'
        }
    },
    vivienda_otra: {
        type: Sequelize.STRING,
    },
    cruzamientos: {
        type: Sequelize.STRING,
    },
    referencia: {
        type: Sequelize.STRING,
    },
    periodicidad_ingresos: {
        type: Sequelize.STRING,
    },
    niveles_casa: {
        type: Sequelize.INTEGER,
    },
    color_casa: {
        type: Sequelize.STRING,
    },
    personas_viviendo: {
        type: Sequelize.INTEGER,
    },
    num_ext: {
        type: Sequelize.STRING,
    },
    num_int: {
        type: Sequelize.STRING,
    },
    ingreso_mensual: {
        type: Sequelize.FLOAT,
    },
    parentesco_contacto1:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Parentesco',
            key: 'id'
        }
    },
    parentesco_contacto2:{
        type: Sequelize.INTEGER,
        references:{
            model: 'Parentesco',
            key: 'id'
        }
    },
    observaciones: {
        type: Sequelize.STRING,
    },
    locked: {
        type: Sequelize.INTEGER,
    },
    direccion_contacto1: {
        type: Sequelize.STRING,
    },
    direccion_contacto2: {
        type: Sequelize.STRING,
    },
    fecha_presupuestal: {
        type: Sequelize.DATE,
    },
    observaciones_negocio: {
        type: Sequelize.STRING,
    },
}, {
    tableName: 'solicitud_credito',
    schema: 'dbo',
    timestamps: false
});

SolicitudCredito.belongsTo(Cliente, { as: 'cliente', foreignKey: 'cliente_id' });
SolicitudCredito.belongsTo(TipoIdentificacion, { as: 'tipoIdentificacion', foreignKey: 'tipo_identificacion_id' });
SolicitudCredito.belongsTo(Ocupacion, {as: 'ocupacion', foreignKey: 'ocupacion_id'});
SolicitudCredito.belongsTo(Agencia, {as: 'agencia', foreignKey: 'agencia_id'});
SolicitudCredito.belongsTo(TipoEstatusSolicitud, {as: 'tipoEstatusSolicitud', foreignKey: 'estatus_sol_id'});
SolicitudCredito.belongsTo(Parentesco, {as: 'parentesco1', foreignKey: 'parentesco_contacto1'});
SolicitudCredito.belongsTo(Parentesco, {as: 'parentesco2', foreignKey: 'parentesco_contacto2'});
SolicitudCredito.belongsTo(Tarifa, { as: 'tarifa', foreignKey: 'tarifa_id' });
SolicitudCredito.belongsTo(TipoEmpleo, { as: 'tipoEmpleo', foreignKey: 'tipo_empleo_id' });

module.exports = SolicitudCredito;
