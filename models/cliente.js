const Sequelize = require('sequelize');
const sequelize = require('../database/config');

const TipoCliente = require('./tipo_cliente');
const Agencia = require('./agencia');
const Colonia = require('./colonia');

const Cliente = sequelize.define('Cliente', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: Sequelize.STRING,
    },
    apellido_paterno: {
        type: Sequelize.STRING,
    },
    apellido_materno: {
        type: Sequelize.STRING,
    },
    telefono: {
        type: Sequelize.STRING,
        validate: {
            is: /^[0-9]+$/i, // Validación para asegurarte de que solo contenga dígitos
        }
    },
    tipo_cliente_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'TipoCliente',
            key: 'id'
        }
    },
    sexo: {
        type: Sequelize.STRING,
    },
    rfc: {
        type: Sequelize.STRING,
    },
    curp: {
        type: Sequelize.STRING,
    },
    fecha_nacimiento: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    num_cliente_historico: {
        type: Sequelize.INTEGER,
    },
    num_cliente: {
        type: Sequelize.INTEGER,
    },
    agencia_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'Agencia',
            key: 'id'
        }
    },
    calle: {
        type: Sequelize.STRING,
    },
    num_ext: {
        type: Sequelize.STRING,
    },
    num_int: {
        type: Sequelize.STRING,
    },
    colonia_id: {
        type: Sequelize.INTEGER,
        references: {
            model: 'Colonia',
            key: 'id'
        }
    },
    municipio: {
        type: Sequelize.STRING,
    },
    localidad: {
        type: Sequelize.STRING,
    },
    estado: {
        type: Sequelize.STRING,
    },
    cruzamientos: {
        type: Sequelize.STRING,
    },
    referencia: {
        type: Sequelize.STRING,
    },
}, {
    tableName: 'clientes',
    schema: 'dbo',
    timestamps: false
});

Cliente.prototype.getNombreCompleto = function () {
    return `${this.nombre} ${this.apellido_paterno} ${this.apellido_materno}`;
}

Cliente.belongsTo(TipoCliente, { as: 'tipoCliente', foreignKey: 'tipo_cliente_id' });
Cliente.belongsTo(Agencia, { as: 'agencia', foreignKey: 'agencia_id' });
Cliente.belongsTo(Colonia, { as: 'colonia', foreignKey: 'colonia_id' });

module.exports = Cliente;
