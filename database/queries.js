const queries = {

    getTarifas:         'SELECT * FROM dbo.tarifas order by num_semanas',
    getTarifa:          'SELECT * FROM dbo.tarifas WHERE id = $1',
    insertTarifa:       'INSERT INTO dbo.tarifas (num_semanas, cociente, nombre) VALUES($1, $2, $3) RETURNING *',
    updateTarifa:       'UPDATE dbo.tarifas set num_semanas = $1, cociente = $2, nombre = $3 WHERE id = $4 RETURNING *',
    deleteTarifa:       'DELETE FROM dbo.tarifas WHERE id = $1 RETURNING *',

    getPago:                `SELECT a.id, b.num_contrato, a.credito_id, a.folio,
                            a.fecha, a.hora, a.metodo_pago, a.monto,a.weekyear, a.observaciones, a.cancelado
                            FROM dbo.pagos a
                            INNER JOIN 
                            dbo.creditos b
                            on a.credito_id = b.id
                            WHERE a.id = $1`,

    getPagos:               `SELECT 
                            a.id,
                            b.num_contrato,
                            a.folio, 
                            c.apellido_paterno || ' ' || c.apellido_materno || ' ' || c.nombre as cliente,
                            a.credito_id, a.fecha, a.hora, a.metodo_pago, a.monto, a.observaciones, a.cancelado
                            FROM dbo.pagos a
                            INNER JOIN 
                            dbo.creditos b
                            on a.credito_id = b.id
                            INNER JOIN 
                            dbo.clientes c
                            on b.cliente_id = c.id
                            ORDER BY a.fecha asc`,

    getPagosByCreditoId:    `SELECT 
                            a.id, 
                            b.num_contrato,
                            a.folio, 
                            c.apellido_paterno || ' ' || c.apellido_materno || ' ' || c.nombre as cliente,
                            a.credito_id, a.fecha, a.hora, a.monto
                            FROM dbo.pagos a
                            INNER JOIN 
                            dbo.creditos b
                            on a.credito_id = b.id AND a.cancelado IS NULL
                            INNER JOIN 
                            dbo.clientes c
                            on b.cliente_id = c.id
                            WHERE
                            a.credito_id = $1
                            ORDER BY a.fecha DESC`,

    insertPago:             `INSERT INTO dbo.pagos (credito_id, fecha, monto, weekyear, folio, serie) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
    updatePago:             `UPDATE dbo.pagos 
                            SET observaciones = $1, cancelado = 1 
                            WHERE id = $2 RETURNING *`,

    deletePago:             `DELETE FROM dbo.pagos WHERE id = $1 RETURNING *`,

    getSeriePago:           `SELECT c.nombre as agencia, d.nombre as zona
                            FROM 
                            dbo.creditos a
                            INNER JOIN
                            dbo.clientes b
                            on a.cliente_id = b.id
                            INNER JOIN
                            dbo.agencias c
                            on b.agencia_id = c.id
                            INNER JOIN
                            dbo.zonas d
                            on c.zona_id = d.id
                            WHERE a.id = $1 `,

    getSemana:              `SELECT id, fecha_inicio, fecha_fin, weekyear, year, estatus FROM dbo.semanas WHERE id = $1`,
    getSemanas:             `SELECT id, fecha_inicio, fecha_fin, weekyear, year, estatus FROM dbo.semanas ORDER BY year desc, weekyear desc`,
    insertSemana:           `INSERT INTO dbo.semanas (fecha_inicio, fecha_fin, weekyear, year, estatus) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    updateSemana:           `UPDATE dbo.semanas SET fecha_inicio = $1, fecha_fin = $2, weekyear = $3, year = $4, estatus = $5 WHERE id = $6 RETURNING*`,
    deleteSemana:           `DELETE FROM dbo.semanas WHERE id = $1 RETURNING *`,

    getSucursales:          'SELECT * FROM dbo.sucursales order by nombre',
    getSucursal:            'SELECT * FROM dbo.sucursales WHERE id = $1',
    insertSucursal:         'INSERT INTO dbo.sucursales (nombre, clave) VALUES($1, $2) RETURNING *',
    updateSucursal:         'UPDATE dbo.sucursales SET nombre = $1, clave = $2 WHERE id = $3 RETURNING *',
    deleteSucursal:         'DELETE FROM dbo.sucursales WHERE id = $1 RETURNING *',

    getCliente:             `SELECT
                            a.id, a.num_cliente, d.clave||'-'||a.num_cliente as num_cliente2, 
                            c.sucursal_id, 
                            b.zona_id, 
                            c.nombre as zona,
                            a.agencia_id, 
                            b.nombre as agencia,
                            a.nombre, a.apellido_paterno, a.apellido_materno, 
                            a.nombre||' '||a.apellido_paterno||' '||a.apellido_materno as nombre_completo, 
                            a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email,
                            a.calle, a.num_ext, a.num_int, a.cruzamientos, a.referencia, a.municipio, a.localidad, a.estado,
                            a.colonia_id, e.cp
                            FROM dbo.clientes a 
                            INNER JOIN dbo.agencias b
                            on a.agencia_id = b.id
                            INNER JOIN dbo.zonas c
                            on b.zona_id = c.id
                            INNER JOIN dbo.sucursales d 
                            on c.sucursal_id = d.id
                            INNER JOIN dbo.colonias e
                            on a.colonia_id = e.id
                            WHERE a.id = $1`,

    getClientes:            `SELECT a.id, a.num_cliente, d.clave||'-'||a.num_cliente as num_cliente2, 
                            a.nombre, a.apellido_paterno, a.apellido_materno, 
                            a.nombre||' '||a.apellido_paterno||' '||a.apellido_materno as nombre_completo, 
                            c.nombre as zona,
                            b.nombre as agencia, 
                            a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email,
                            a.calle, a.num_ext, a.num_int, a.localidad, 
                            a.municipio, a.estado, a.cruzamientos, a.referencia, 
                            a.colonia_id, e.cp, 
                            a.agencia_id, b.zona_id, c.sucursal_id,
                            fu_calcula_num_creditos_by_cliente(a.id) as num_creditos
                            FROM dbo.clientes a
                            INNER JOIN
                            dbo.agencias b
                            on a.agencia_id = b.id
                            INNER JOIN
                            dbo.zonas c
                            on b.zona_id = c.id
                            INNER JOIN
                            dbo.sucursales d
                            on c.sucursal_id = d.id
                            INNER JOIN dbo.colonias e
                            on a.colonia_id = e.id
                            ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`,

    getClientesTotal:       `SELECT count(*) as total_clientes FROM dbo.clientes`,

    getClientesByCriteria:  `SELECT 
                            a.id, a.num_cliente, b.clave||'-'||a.num_cliente as num_cliente2, 
                            a.nombre, a.apellido_paterno, a.apellido_materno, 
                            a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email,
                            fu_calcula_num_creditos_by_cliente(a.id) as num_creditos
                            FROM dbo.clientes a, dbo.sucursales b 
                            WHERE a.sucursal_id = b.id AND $1 = $2 ORDER BY a.apellido_paterno, a.apellido_materno, a.nombre`,

                            //corregir el a.* OJO, si se quita así nada mas hay datos que no están específicos en la consulta. Hay que revisarlos uno por uno.
    getSolCredito:          `SELECT 
                            a.*,
                            a.id, 
                            k.clave ||'-'||b.num_cliente as num_cliente,
                            b.apellido_paterno, b.apellido_materno, b.nombre, 
                            b.nombre||' '||b.apellido_paterno||' '||COALESCE(b.apellido_materno,'') as nombre_completo,  
                            b.fecha_nacimiento,
                            b.sexo, b.telefono, b.rfc, b.curp, b.email,
                            c.id as estatus_sol_id, c.nombre as estatus, 
                            a.nombre_contacto1,
                            a.direccion_contacto1,
                            a.telefono_contacto1, 
                            a.nombre_contacto2,
                            a.direccion_contacto2,
                            a.telefono_contacto2, 
                            a.fecha_solicitud, a.monto, a.observaciones,
                            a.ingreso_mensual, a.tipo_empleo_id,
                            a.num_identificacion, a.tipo_identificacion_id, 
                            d.nombre as tipo_identificacion, 
                            a.vivienda, a.vivienda_otra,
                            a.num_dependientes, 
                            a.tiempo_vivienda_años, a.tiempo_vivienda_meses,
                            a.observaciones_negocio,
                            a.tiempo_empleo_años, a.tiempo_empleo_meses, 
                            a.fecha_creacion, 
                            a.tarifa_id,
                            n.monto,
                            a.calle, a.num_ext, a.num_int, 
                            a.municipio, a.localidad, a.estado, 
                            f.id as colonia_id, 
                            f.nombre as colonia, f.cp, 
                            g.id as ocupacion_id, 
                            g.nombre as ocupacion, 
                            i.id as agencia_id, i.nombre as agencia, j.id as zona_id, j.nombre as zona, k.id as sucursal_id, k.nombre as sucursal,
                            l.id as tarifa_id,
                            m.luz, m.agua_potable, m.auto_propio, m.telefono_fijo, m.telefono_movil, m.refrigerador,
                            m.estufa, m.internet, m.gas, m.alumbrado_publico, m.tv,
                            a.parentesco_contacto1,
                            a.parentesco_contacto2
                            FROM  
                            dbo.solicitud_credito a 
                            LEFT JOIN  
                            dbo.clientes b 
                            on a.cliente_id = b.id 
                            LEFT JOIN 
                            dbo.tipo_estatus_solicitud c   
                            on a.estatus_sol_id = c.id 
                            LEFT JOIN 
                            dbo.tipo_identificacion d 
                            on a.tipo_identificacion_id = d.id 
                            LEFT JOIN 
                            dbo.colonias f 
                            on f.id = a.colonia_id 
                            LEFT JOIN 
                            dbo.ocupaciones g 
                            on a.ocupacion_id = g.id 
                            LEFT JOIN 
                            dbo.tipo_estatus_solicitud h 
                            on a.estatus_sol_id = h.id 
                            LEFT JOIN 
                            dbo.agencias i 
                            on a.agencia_id = i.id 
                            INNER JOIN
                            dbo.zonas j
                            on i.zona_id = j.id
                            INNER JOIN
                            dbo.sucursales k
                            on j.sucursal_id = k.id
                            INNER JOIN
                            dbo.tarifas l
                            on a.tarifa_id = l.id
                            LEFT JOIN 
                            dbo.solicitud_servicio m
                            on a.id = m.solicitud_credito_id
                            LEFT JOIN 
                            dbo.tarifas n
                            on a.tarifa_id = n.id
                            WHERE a.id = $1`,

    getSolCreditoByClienteId:   `SELECT a.id,
                                k.clave ||'-'||b.id as num_cliente,
                                b.nombre||' '||b.apellido_paterno||' '||b.apellido_materno as nombre_completo,  
                                b.apellido_paterno, b.apellido_materno, b.nombre, b.fecha_nacimiento,
                                b.sexo, b.telefono, b.rfc, b.curp, b.email,
                                c.id as estatus_id, c.nombre as estatus, 
                                a.fecha_solicitud, a.monto, a.observaciones,
                                a.num_identificacion, a.tipo_identificacion_id, a.tipo_empleo_id,
                                d.nombre as tipo_identificacion, a.ingreso_mensual,
                                a.vivienda, a.vivienda_otra,
                                a.num_dependientes, 
                                a.tiempo_vivienda_años, a.tiempo_vivienda_meses,
                                a.tiempo_empleo_años, a.tiempo_empleo_meses, 
                                a.fecha_creacion, 
                                a.calle, a.num_ext, a.num_int, a.referencia, a.cruzamientos,
                                a.municipio, a.localidad, a.estado, 
                                f.id as colonia_id, 
                                f.nombre as colonia, f.cp, 
                                g.id as ocupacion_id, 
                                g.nombre as ocupacion, 
                                i.id as agencia_id, j.id as zona_id, k.id as sucursal_id,
                                l.id as tarifa_id,
                                m.luz, m.agua_potable, m.auto_propio, m.telefono_fijo, m.telefono_movil, m.refrigerador,
                                m.estufa, m.internet, m.gas, m.alumbrado_publico, m.tv,
                                a.parentesco_contacto1,
                                a.parentesco_contacto2,
                                a.telefono_contacto1, a.telefono_contacto2, 
                                a.direccion_contacto1, a.direccion_contacto2,
                                a.nombre_contacto1, a.nombre_contacto2, a.personas_viviendo, a.color_casa, a.color_porton, a.niveles_casa
                                FROM  
                                dbo.solicitud_credito a 
                                LEFT JOIN  
                                dbo.clientes b 
                                on a.cliente_id = b.id 
                                LEFT JOIN 
                                dbo.tipo_estatus_solicitud c   
                                on a.estatus_sol_id = c.id 
                                LEFT JOIN 
                                dbo.tipo_identificacion d 
                                on a.tipo_identificacion_id = d.id 
                                LEFT JOIN 
                                dbo.colonias f 
                                on f.id = a.colonia_id 
                                LEFT JOIN 
                                dbo.ocupaciones g 
                                on a.ocupacion_id = g.id 
                                LEFT JOIN 
                                dbo.tipo_estatus_solicitud h 
                                on a.estatus_sol_id = h.id 
                                LEFT JOIN 
                                dbo.agencias i 
                                on a.agencia_id = i.id 
                                INNER JOIN
                                dbo.zonas j
                                on i.zona_id = j.id
                                INNER JOIN
                                dbo.sucursales k
                                on j.sucursal_id = k.id
                                INNER JOIN
                                dbo.tarifas l
                                on a.tarifa_id = l.id
                                LEFT JOIN 
                                dbo.solicitud_servicio m
                                on a.id = m.solicitud_credito_id
                                WHERE a.id = (select max(id) from dbo.solicitud_credito where cliente_id = $1)`,

    getSolCreditoExceptions:`SELECT a.*, a.id, 
                            a.estatus_sol_id,
                            b.apellido_paterno, b.apellido_materno, b.nombre, b.fecha_nacimiento,
                            b.sexo, b.telefono, b.rfc, b.curp, b.email,
                            c.id as estatus_id, c.nombre as estatus, 
                            a.telefono_contacto1, a.telefono_contacto2, 
                            a.fecha_solicitud, a.monto, a.observaciones,
                            a.num_identificacion, a.tipo_identificacion_id, 
                            d.nombre as tipo_identificacion, 
                            a.vivienda, a.vivienda_otra,
                            a.num_dependientes, 
                            a.tiempo_vivienda_años, a.tiempo_vivienda_meses,
                            a.tiempo_empleo_años, a.tiempo_empleo_meses, 
                            a.fecha_creacion, 
                            a.calle, a.num_ext, a.num_int, 
                            a.municipio, a.localidad, a.estado, 
                            f.id as colonia_id, 
                            f.nombre as colonia, f.cp, 
                            g.id as ocupacion_id, 
                            g.nombre as ocupacion, 
                            i.id as agencia_id, j.id as zona_id, k.id as sucursal_id,
                            l.id as tarifa_id,
                            m.luz, m.agua_potable, m.auto_propio, m.telefono_fijo, m.telefono_movil, m.refrigerador,
                            m.estufa, m.internet, m.gas, m.alumbrado_publico, m.tv,
                            a.parentesco_contacto1,
                            a.parentesco_contacto2
                            FROM  
                            dbo.solicitud_credito a 
                            LEFT JOIN  
                            dbo.clientes b 
                            on a.cliente_id = b.id 
                            LEFT JOIN 
                            dbo.tipo_estatus_solicitud c   
                            on a.estatus_sol_id = c.id 
                            LEFT JOIN 
                            dbo.tipo_identificacion d 
                            on a.tipo_identificacion_id = d.id 
                            LEFT JOIN 
                            dbo.colonias f 
                            on f.id = a.colonia_id 
                            LEFT JOIN 
                            dbo.ocupaciones g 
                            on a.ocupacion_id = g.id 
                            LEFT JOIN 
                            dbo.tipo_estatus_solicitud h 
                            on a.estatus_sol_id = h.id 
                            LEFT JOIN 
                            dbo.agencias i 
                            on a.agencia_id = i.id 
                            INNER JOIN
                            dbo.zonas j
                            on i.zona_id = j.id
                            INNER JOIN
                            dbo.sucursales k
                            on j.sucursal_id = k.id
                            INNER JOIN
                            dbo.tarifas l
                            on a.tarifa_id = l.id
                            LEFT JOIN 
                            dbo.solicitud_servicio m
                            on a.id = m.solicitud_credito_id
                            WHERE a.locked IS NULL or a.id = $1`,

    getSolCreditos:         `SELECT a.id, 
                            a.cliente_id,
                            a.monto, a.tarifa_id,
                            TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                            b.apellido_paterno, b.apellido_materno, b.nombre, 
                            a.fecha_solicitud, c.id as estatus_sol_id, c.nombre as estatus,
                            a.monto,
                            d.id as agencia_id,
                            d.nombre as agencia,
                            e.id as zona_id,
                            e.nombre as zona,
                            f.id as sucursal_id,
                            f.nombre as sucursal,
                            a.locked
                            FROM 
                            dbo.solicitud_credito a
                            INNER JOIN
                            dbo.clientes b
                            on a.cliente_id = b.id
                            INNER JOIN 
                            dbo.tipo_estatus_solicitud c 
                            on a.estatus_sol_id = c.id 
                            INNER JOIN
                            dbo.agencias d
                            on b.agencia_id = d.id
                            INNER JOIN
                            dbo.zonas e
                            on d.zona_id = e.id
                            INNER JOIN
                            dbo.sucursales f
                            on e.sucursal_id = f.id
                            ORDER BY a.id`,

    getSolCreditosTotales:  `SELECT
                                    a.sol_creditos_count AS total_solicitudes,
                                    b.solicitudes_revisar_count AS total_solicitudes_revisar,
                                    c.solicitudes_presupuesto_count as total_solicitudes_presupuesto,
                                    d.solicitudes_aprobadas_entrega_count as total_solicitudes_aprobadas,
                                    e.solicitudes_rechazadas_count as total_solicitudes_rechazadas
                                FROM
                                    (SELECT COUNT(scred.id) AS sol_creditos_count FROM dbo.solicitud_credito scred ) AS a
                                JOIN
                                    (	SELECT COUNT(scred.id) AS solicitudes_revisar_count
                                            FROM dbo.solicitud_credito scred 
                                            WHERE scred.estatus_sol_id = 3 ) as b
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(scred.id) AS solicitudes_presupuesto_count 
                                            FROM dbo.solicitud_credito scred 
                                            WHERE scred.estatus_sol_id = 6 ) as c
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(scred.id) AS solicitudes_aprobadas_entrega_count 
                                            FROM dbo.solicitud_credito scred 
                                            WHERE scred.estatus_sol_id = 7 ) as d
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(scred.id) AS solicitudes_rechazadas_count 
                                            FROM dbo.solicitud_credito scred 
                                            WHERE scred.estatus_sol_id = 2 ) as e
                                ON 1=1`,

    deleteSolCredito:       'DELETE FROM dbo.solicitud_credito WHERE id = $1 RETURNING *',
    
    getZonas:               `SELECT a.id, a.nombre, a.sucursal_id, b.nombre as sucursal 
                            FROM
                            dbo.zonas a
                            INNER JOIN
                            dbo.sucursales b
                            on a.sucursal_id = b.id
                            ORDER BY b.nombre, a.nombre`,
                            
    getZona:                `SELECT * FROM dbo.zonas WHERE id = $1`,
    insertZona:             'INSERT INTO dbo.zonas (nombre, sucursal_id) VALUES($1, $2) RETURNING *',
    updateZona:             'UPDATE dbo.zonas set nombre = $1, sucursal_id = $2 WHERE id = $3 RETURNING *',
    deleteZona:             'DELETE FROM dbo.zonas WHERE id = $1 RETURNING *',
    getZonasBySucursalId:   'SELECT a.id, a.nombre FROM dbo.zonas a WHERE a.sucursal_id = $1 order by a.nombre',

    getMonto:               `SELECT a.id, a.monto, b.id as tarifa_id
                            FROM dbo.montos a 
                            INNER JOIN
                            dbo.tarifas b
                            on a.tarifa_id = b.id
                            WHERE a.id = $1`,

    getMontos:              `SELECT a.id, a.monto as monto, b.id as tarifa_id, 
                            b.nombre as tarifa
                            FROM 
                            dbo.montos a
                            INNER JOIN
                            dbo.tarifas b
                            on a.tarifa_id = b.id ORDER BY b.nombre, a.monto`,

    insertMonto:            'INSERT INTO dbo.montos (monto, tarifa_id) VALUES($1, $2) RETURNING *',
    updateMonto:            'UPDATE dbo.montos set monto = $1, tarifa_id = $2 WHERE id = $3 RETURNING *',
    deleteMonto:            'DELETE FROM dbo.montos WHERE id = $1 RETURNING *',

    getGroups:              'SELECT * FROM dbo.group order by nombre',
    getGroup:               'SELECT * FROM dbo.group WHERE id = $1',
    insertGroup:            'INSERT INTO dbo.group (nombre, descripcion) VALUES($1, $2) RETURNING *',
    updateGroup:            'UPDATE dbo.group set nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
    deleteGroup:            'DELETE FROM dbo.group WHERE id = $1 RETURNING *',

    getAgencias:            `SELECT 
                            a.id, a.nombre, 
                            b.id as zona_id, 
                            b.nombre as zona
                            FROM dbo.agencias a 
                            INNER JOIN dbo.zonas b
                            on a.zona_id = b.id
                            ORDER BY b.nombre, a.nombre`,
                            
    getAgencia:             'SELECT * FROM dbo.agencias WHERE id = $1',
    insertAgencia:          'INSERT INTO dbo.agencias (nombre, zona_id) VALUES($1, $2) RETURNING *',
    updateAgencia:          'UPDATE dbo.agencias set nombre = $1, zona_id = $2 WHERE id = $3 RETURNING *',
    deleteAgencia:          'DELETE FROM dbo.agencias WHERE id = $1 RETURNING *',
    getAgenciasByZonaId:    'SELECT a.id, a.nombre FROM dbo.agencias a WHERE a.zona_id = $1 order by a.nombre',

    getOcupaciones:     'SELECT * FROM dbo.ocupaciones order by nombre',
    getOcupacion:       'SELECT * FROM dbo.ocupaciones WHERE id = $1',
    insertOcupacion:    'INSERT INTO dbo.ocupaciones (nombre) VALUES($1) RETURNING *',
    updateOcupacion:    'UPDATE dbo.ocupaciones set nombre = $1 WHERE id = $2 RETURNING *',
    deleteOcupacion:    'DELETE FROM dbo.ocupaciones WHERE id = $1 RETURNING *',

    getRoles:           'SELECT * FROM dbo.roles order by nombre',
    getRole:            'SELECT * FROM dbo.roles WHERE id = $1',
    insertRole:         'INSERT INTO dbo.roles (nombre, descripcion) VALUES($1, $2) RETURNING *',
    updateRole:         'UPDATE dbo.roles set nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
    deleteRole:         'DELETE FROM dbo.roles WHERE id = $1 RETURNING *',

    getServicios:       'SELECT * FROM dbo.servicios order by nombre',
    getServicio:        'SELECT * FROM dbo.servicios WHERE id = $1',
    insertServicio:     'INSERT INTO dbo.servicios (nombre) VALUES($1) RETURNING *',

    insertServicios:    `INSERT INTO dbo.solicitud_servicio (solicitud_credito_id, luz, agua_potable, auto_propio, 
                        telefono_fijo, telefono_movil, refrigerador, estufa, internet, gas, tv, alumbrado_publico) 
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,

    updateServicios:    `UPDATE dbo.solicitud_servicio  
                        SET luz = $1, agua_potable = $2, auto_propio = $3, 
                        telefono_fijo = $4, telefono_movil = $5, refrigerador = $6, 
                        estufa = $7, internet = $8, gas = $9, 
                        tv = $10, alumbrado_publico = $11 
                        WHERE solicitud_credito_id = $12 RETURNING *`,

    updateServicio:     'UPDATE dbo.servicios set nombre = $1 WHERE id = $2 RETURNING *',
    deleteServicio:     'DELETE FROM dbo.servicios WHERE id = $1 RETURNING *',

    getTipoClientes:    'SELECT * FROM dbo.tipo_cliente order by nombre',
    getTipoCliente:     'SELECT * FROM dbo.tipo_cliente WHERE id = $1',
    insertTipoCliente:  'INSERT INTO dbo.tipo_cliente (nombre) VALUES($1) RETURNING *',
    updateTipoCliente:  'UPDATE dbo.tipo_cliente set nombre = $1 WHERE id = $2',
    deleteTipoCliente:  'DELETE FROM dbo.tipo_cliente WHERE id = $1 RETURNING *',
    
    getColonias:        `SELECT a.id, b.nombre as tipo_asentamiento, 
                        b.id as tipo_asentamiento_id, a.nombre, a.cp
                        FROM
                        dbo.colonias a
                        INNER JOIN
                        dbo.tipo_asentamiento b
                        on a.tipo_asentamiento_id = b.id ORDER BY a.nombre`,

    getColonia:         `SELECT a.id, b.nombre as tipo_asentamiento, 
                        b.id as tipo_asentamiento_id, a.nombre, a.cp
                        FROM
                        dbo.colonias a
                        INNER JOIN
                        dbo.tipo_asentamiento b
                        on a.tipo_asentamiento_id = b.id WHERE a.id = $1 `,
                        
    insertColonia:      'INSERT INTO dbo.colonias (nombre, cp, tipo_asentamiento_id) '+
                        'VALUES($1, $2, $3) RETURNING *',

    deleteColonia:      'DELETE FROM dbo.colonias WHERE id = $1 RETURNING *',

    getDirecciones:     'SELECT * FROM dbo.direcciones order by id',
    getDireccion:       'SELECT * FROM dbo.direcciones WHERE id = $1',
    //El INSERT y el UPDATE van programados
    deleteDireccion:    'DELETE FROM dbo.direcciones WHERE id = $1 RETURNING *',

    getUsuarios:        `SELECT a.id, a.nombre, a.apellido_paterno, a.apellido_materno, a.email,
                        TRIM(a.nombre||' '||a.apellido_paterno||' '||COALESCE(a.apellido_materno,'')) as nombre_completo,
                        b.nombre as role_nombre,
                        c.nombre as user_group_nombre
                        FROM dbo.usuarios a 
                        LEFT JOIN
                        dbo.roles b
                        on a.role_id = b.id
                        LEFT JOIN
                        dbo.user_group c
                        on c.id = a.user_group_id
                        ORDER BY a.id`,

    getUsuario:         `
                        SELECT a.id, a.nombre, a.apellido_paterno, a.apellido_materno, a.email, a.usuario,
                        TRIM(a.nombre||' '||a.apellido_paterno||' '||COALESCE(a.apellido_materno,'')) as nombre_completo,
                        b.id as role_id, a.user_group_id, 
                        b.nombre as role_nombre,
                        c.nombre as user_group_nombre
                        FROM dbo.usuarios a 
                        LEFT JOIN
                        dbo.roles b
                        on a.role_id = b.id
                        LEFT JOIN
                        dbo.user_group c
                        on c.id = a.user_group_id
                        WHERE a.id = $1`,

    //El INSERT y el UPDATE van programados
    deleteUsuario:      'DELETE FROM dbo.usuarios WHERE id = $1 RETURNING *',

    getUserRoles:       `SELECT 
                        a.id, 
                        b.nombre||' '||b.apellido_paterno||' '||b.apellido_materno as usuario_nombre,
                        c.nombre as role_nombre 
                        FROM 
                        dbo.user_role a, 
                        dbo.usuarios b, 
                        dbo.roles c 
                        WHERE a.usuario_id = b. id 
                        AND a.role_id = c.id order by b.id, c.id`,

    getUserRole:        `SELECT 
                        a.id, 
                        b.nombre, b.apellido_paterno, b.apellido_materno, 
                        c.nombre as role 
                        FROM 
                        dbo.user_role a, 
                        dbo.usuarios b, 
                        dbo.roles c 
                        WHERE a.usuario_id = b.id 
                        AND a.role_id = c.id AND b.id = $1`,

    getUserGroups:      `SELECT 
                        a.id, 
                        b.nombre, b.apellido_paterno, b.apellido_materno, 
                        c.nombre as role 
                        FROM 
                        dbo.user_group a, 
                        dbo.usuarios b, 
                        dbo.group c 
                        WHERE a.usuario_id = b. id 
                        AND a.group_id = c.id order by c.nombre, b.id`,

    getGroupRoles:      `SELECT 
                        a.id, 
                        b.nombre as group, 
                        c.nombre as role 
                        FROM 
                        dbo.group_role a, 
                        dbo.group b, 
                        dbo.roles c 
                        WHERE a.group_id = b. id 
                        AND a.role_id = c.id 
                        ORDER BY b.nombre, c.nombre`,

    getRolesByUserId:   `SELECT 
                        e.nombre as role 
                        FROM dbo.usuarios a 
                        LEFT JOIN dbo.user_group b 
                        on a.id = b.usuario_id 
                        LEFT JOIN dbo.group c 
                        on b.group_id = c.id 
                        LEFT JOIN dbo.group_role d 
                        on d.group_id = c.id 
                        INNER JOIN dbo.roles e 
                        on e.id = d.role_id 
                        WHERE a.id = $1 
                        UNION 
                        SELECT 
                        c.nombre as role 
                        FROM dbo.usuarios a 
                        LEFT JOIN dbo.user_role b 
                        on a.id = b.usuario_id 
                        INNER JOIN dbo.roles c 
                        on  b.role_id = c.id 
                        WHERE a.id = $1`,

    getCreditos:        `SELECT 
                        a.id, 
                        j.clave ||'-'|| a.cliente_id as num_cliente,
                        a.solicitud_credito_id,
                        a.cliente_id, 
                        a.num_contrato, 
                        a.monto_otorgado, 
                        a.fecha_creacion, 
                        a.fecha_entrega_prog,
                        (a.fecha_entrega_prog,'') as fecha_entrega_prog2,
                        a.hora_entrega,
                        a.fecha_inicio_prog,
                        a.fecha_entrega_real,
                        a.fecha_inicio_real,
                        a.tarifa_id,
                        b.nombre as tarifa,
                        TRIM(TO_CHAR((a.monto_total / b.num_semanas),'999,999D99')) as monto_semanal,
                        TRIM(TO_CHAR((a.monto_otorgado),'999,999D99')) as monto_otorgado2,
                        TRIM(TO_CHAR((a.fecha_inicio_prog),'dd/MM/yyyy')) as fecha_inicio_prog3,
                        fu_get_cn_renovacion(a.id) as cn_r,
                        b.num_semanas, 
                        c.nombre, c.apellido_paterno, c.apellido_materno, 
                        c.calle, c.num_ext, l.nombre as colonia, c.telefono,
                        c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                        i.nombre as zona,  
                        h.nombre as agencia,
                        e.nombre as tipo_contrato, 
                        f.nombre as tipo_credito, 
                        g.id as estatus_credito_id,
                        g.nombre as estatus_credito,
                        k.nombre as estatus_contrato,
                        a.locked,
                        a.renovacion,
                        a.preaprobado,
                        a.entregado,
                        a.no_entregado,
                        a.num_cheque,
                        a.motivo,
                        a.inversion_positiva,
                        fu_calcula_dias_penalizaciones(a.id) as dias_penalizaciones
                        FROM  
                        dbo.creditos a 
                        LEFT JOIN  
                        dbo.tarifas b 
                        on a.tarifa_id=b.id 
                        LEFT JOIN 
                        dbo.clientes c 
                        on a.cliente_id = c.id 
                        LEFT JOIN 
                        dbo.tipo_contrato e 
                        on a.tipo_contrato_id = e.id 
                        LEFT JOIN 
                        dbo.tipo_credito f 
                        on a.tipo_credito_id = f.id 
                        LEFT JOIN  
                        dbo.tipo_estatus_credito g 
                        on a.estatus_credito_id = g.id 
                        LEFT JOIN
                        dbo.tipo_estatus_contrato k
                        on a.estatus_contrato_id = k.id
                        INNER JOIN 
                        dbo.agencias h 
                        on c.agencia_id = h.id 
                        INNER JOIN 
                        dbo.zonas i 
                        on h.zona_id = i.id 
                        INNER JOIN 
                        dbo.sucursales j 
                        on i.sucursal_id = j.id 
                        INNER JOIN
                        dbo.solicitud_credito m
                        on a.solicitud_credito_id = m.id
                        INNER JOIN
                        dbo.colonias l
                        on m.colonia_id = l.id
                        ORDER BY a.no_entregado, a.id`,

    getCreditosTotales:   `SELECT
                                    a.creditos_count AS total_creditos,
                                    b.creditos_prog_entrega_count AS total_creditos_prog_entrega,
                                    c.creditos_marcar_entrega_count AS total_creditos_marcar_entrega,
                                    d.creditos_entregados_count as total_creditos_entregados,
                                    e.creditos_no_entregados_count as total_creditos_no_entregados
                                FROM
                                    (SELECT COUNT(cred.id) AS creditos_count FROM dbo.creditos cred ) AS a
                                JOIN
                                    (	SELECT COUNT(cred.id) AS creditos_prog_entrega_count 
                                            FROM dbo.creditos cred 
                                            WHERE cred.preaprobado = 1 
                                            AND cred.entregado is null 
                                            AND cred.no_entregado IS NULL ) as b
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(cred.id) AS creditos_marcar_entrega_count 
                                            FROM dbo.creditos cred 
                                            WHERE cred.preaprobado = 1 
                                            AND cred.entregado is null 
                                            AND cred.fecha_entrega_prog IS NOT NULL
                                            AND cred.no_entregado IS NULL ) as c
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(cred.id) AS creditos_entregados_count 
                                            FROM dbo.creditos cred 
                                            WHERE cred.entregado = 1 ) as d
                                ON 1=1
                                JOIN
                                    (	SELECT COUNT(cred.id) AS creditos_no_entregados_count 
                                            FROM dbo.creditos cred 
                                            WHERE 
                                            cred.no_entregado = 1 OR (cred.preaprobado = 1 AND cred.no_entregado is null)
                                    ) as e
                                ON 1=1`,

    getCreditosOptimized:        
                        `SELECT 
                        a.id, 
                        j.clave ||'-'|| a.cliente_id as num_cliente,
                        a.solicitud_credito_id,
                        a.cliente_id, 
                        a.num_contrato, 
                        a.monto_otorgado, 
                        a.fecha_creacion, 
                        a.fecha_entrega_prog,
                        (a.fecha_entrega_prog,'') as fecha_entrega_prog2,
                        a.hora_entrega,
                        a.fecha_inicio_prog,
                        a.fecha_entrega_real,
                        a.fecha_inicio_real,
                        a.tarifa_id,
                        b.nombre as tarifa,
                        TRIM(TO_CHAR((a.monto_total / b.num_semanas),'999,999D99')) as monto_semanal,
                        TRIM(TO_CHAR((a.monto_otorgado),'999,999D99')) as monto_otorgado2,
                        TRIM(TO_CHAR((a.fecha_inicio_prog),'dd/MM/yyyy')) as fecha_inicio_prog3,
                        b.num_semanas, 
                        c.nombre, c.apellido_paterno, c.apellido_materno, 
                        c.calle, c.num_ext, l.nombre as colonia, c.telefono,
                        c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                        i.nombre as zona,  
                        h.nombre as agencia,
                        e.nombre as tipo_contrato, 
                        f.nombre as tipo_credito, 
                        g.id as estatus_credito_id,
                        g.nombre as estatus_credito,
                        k.nombre as estatus_contrato,
                        a.locked,
                        a.renovacion,
                        a.preaprobado,
                        a.entregado,
                        a.no_entregado,
                        a.num_cheque,
                        a.motivo,
                        a.inversion_positiva
                        FROM  
                        dbo.creditos a 
                        LEFT JOIN  
                        dbo.tarifas b 
                        on a.tarifa_id=b.id 
                        LEFT JOIN 
                        dbo.clientes c 
                        on a.cliente_id = c.id 
                        LEFT JOIN 
                        dbo.tipo_contrato e 
                        on a.tipo_contrato_id = e.id 
                        LEFT JOIN 
                        dbo.tipo_credito f 
                        on a.tipo_credito_id = f.id 
                        LEFT JOIN  
                        dbo.tipo_estatus_credito g 
                        on a.estatus_credito_id = g.id 
                        LEFT JOIN
                        dbo.tipo_estatus_contrato k
                        on a.estatus_contrato_id = k.id
                        INNER JOIN 
                        dbo.agencias h 
                        on c.agencia_id = h.id 
                        INNER JOIN 
                        dbo.zonas i 
                        on h.zona_id = i.id 
                        INNER JOIN 
                        dbo.sucursales j 
                        on i.sucursal_id = j.id 
                        INNER JOIN
                        dbo.solicitud_credito m
                        on a.solicitud_credito_id = m.id
                        INNER JOIN
                        dbo.colonias l
                        on m.colonia_id = l.id
                        ORDER BY a.no_entregado, a.id`,

    //Esta consulta no devueve dias de penalizaciones
    getCreditosGenericaOptimizada:   `SELECT 
                            a.id, 
                            j.clave ||'-'|| a.cliente_id as num_cliente,
                            a.solicitud_credito_id,
                            a.cliente_id, 
                            a.num_contrato, 
                            a.monto_otorgado, 
                            a.fecha_creacion, 
                            a.fecha_entrega_prog,
                            a.hora_entrega,
                            a.fecha_inicio_prog,
                            a.fecha_entrega_real,
                            a.fecha_inicio_real,
                            a.tarifa_id,
                            b.nombre as tarifa,
                            TRIM(TO_CHAR((a.monto_total / b.num_semanas),'999,999D99')) as monto_semanal,
                            TRIM(TO_CHAR((a.monto_otorgado),'999,999D99')) as monto_otorgado2,
                            TRIM(TO_CHAR((a.fecha_inicio_prog),'dd/MM/yyyy')) as fecha_inicio_prog3,
                            fu_get_cn_renovacion(a.id) as cn_r,
                            b.num_semanas, 
                            c.nombre, c.apellido_paterno, c.apellido_materno, 
                            c.calle, c.num_ext, l.nombre as colonia, c.telefono,
                            c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                            i.nombre as zona,  
                            h.nombre as agencia,
                            e.nombre as tipo_contrato, 
                            f.nombre as tipo_credito, 
                            g.id as estatus_credito_id,
                            g.nombre as estatus_credito,
                            k.nombre as estatus_contrato,
                            a.locked,
                            a.renovacion,
                            a.preaprobado,
                            a.entregado,
                            a.no_entregado,
                            a.num_cheque,
                            a.motivo,
                            a.inversion_positiva
                            FROM  
                            dbo.creditos a 
                            LEFT JOIN  
                            dbo.tarifas b 
                            on a.tarifa_id=b.id 
                            LEFT JOIN 
                            dbo.clientes c 
                            on a.cliente_id = c.id 
                            LEFT JOIN 
                            dbo.tipo_contrato e 
                            on a.tipo_contrato_id = e.id 
                            LEFT JOIN 
                            dbo.tipo_credito f 
                            on a.tipo_credito_id = f.id 
                            LEFT JOIN  
                            dbo.tipo_estatus_credito g 
                            on a.estatus_credito_id = g.id 
                            LEFT JOIN
                            dbo.tipo_estatus_contrato k
                            on a.estatus_contrato_id = k.id
                            INNER JOIN 
                            dbo.agencias h 
                            on c.agencia_id = h.id 
                            INNER JOIN 
                            dbo.zonas i 
                            on h.zona_id = i.id 
                            INNER JOIN 
                            dbo.sucursales j 
                            on i.sucursal_id = j.id 
                            INNER JOIN
                            dbo.solicitud_credito m
                            on a.solicitud_credito_id = m.id
                            INNER JOIN 
                            dbo.colonias l
                            on m.colonia_id = l.id `,

    getCreditosGenerica:   `SELECT 
                            a.id, 
                            j.clave ||'-'|| a.cliente_id as num_cliente,
                            a.solicitud_credito_id,
                            a.cliente_id, 
                            a.num_contrato, 
                            a.monto_otorgado, 
                            a.fecha_creacion, 
                            a.fecha_entrega_prog,
                            a.hora_entrega,
                            a.fecha_inicio_prog,
                            a.fecha_entrega_real,
                            a.fecha_inicio_real,
                            a.tarifa_id,
                            b.nombre as tarifa,
                            TRIM(TO_CHAR((a.monto_total / b.num_semanas),'999,999D99')) as monto_semanal,
                            TRIM(TO_CHAR((a.monto_otorgado),'999,999D99')) as monto_otorgado2,
                            TRIM(TO_CHAR((a.fecha_inicio_prog),'dd/MM/yyyy')) as fecha_inicio_prog3,
                            fu_get_cn_renovacion(a.id) as cn_r,
                            b.num_semanas, 
                            c.nombre, c.apellido_paterno, c.apellido_materno, 
                            c.calle, c.num_ext, l.nombre as colonia, c.telefono,
                            c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                            i.nombre as zona,  
                            h.nombre as agencia,
                            e.nombre as tipo_contrato, 
                            f.nombre as tipo_credito, 
                            g.id as estatus_credito_id,
                            g.nombre as estatus_credito,
                            k.nombre as estatus_contrato,
                            a.locked,
                            a.renovacion,
                            a.preaprobado,
                            a.entregado,
                            a.no_entregado,
                            a.num_cheque,
                            a.motivo,
                            a.inversion_positiva 
                            FROM  
                            dbo.creditos a 
                            LEFT JOIN  
                            dbo.tarifas b 
                            on a.tarifa_id=b.id 
                            LEFT JOIN 
                            dbo.clientes c 
                            on a.cliente_id = c.id 
                            LEFT JOIN 
                            dbo.tipo_contrato e 
                            on a.tipo_contrato_id = e.id 
                            LEFT JOIN 
                            dbo.tipo_credito f 
                            on a.tipo_credito_id = f.id 
                            LEFT JOIN  
                            dbo.tipo_estatus_credito g 
                            on a.estatus_credito_id = g.id 
                            LEFT JOIN
                            dbo.tipo_estatus_contrato k
                            on a.estatus_contrato_id = k.id
                            INNER JOIN 
                            dbo.agencias h 
                            on c.agencia_id = h.id 
                            INNER JOIN 
                            dbo.zonas i 
                            on h.zona_id = i.id 
                            INNER JOIN 
                            dbo.sucursales j 
                            on i.sucursal_id = j.id 
                            INNER JOIN
                            dbo.solicitud_credito m
                            on a.solicitud_credito_id = m.id
                            INNER JOIN 
                            dbo.colonias l
                            on m.colonia_id = l.id `,

    // getCreditosGenerica:   `SELECT 
    //                         a.id, 
    //                         j.clave ||'-'|| a.cliente_id as num_cliente,
    //                         a.solicitud_credito_id,
    //                         a.cliente_id, 
    //                         a.num_contrato, 
    //                         a.monto_otorgado, 
    //                         a.fecha_creacion, 
    //                         a.fecha_entrega_prog,
    //                         a.hora_entrega,
    //                         a.fecha_inicio_prog,
    //                         a.fecha_entrega_real,
    //                         a.fecha_inicio_real,
    //                         a.tarifa_id,
    //                         b.nombre as tarifa,
    //                         TRIM(TO_CHAR((a.monto_total / b.num_semanas),'999,999D99')) as monto_semanal,
    //                         TRIM(TO_CHAR((a.monto_otorgado),'999,999D99')) as monto_otorgado2,
    //                         TRIM(TO_CHAR((a.fecha_inicio_prog),'dd/MM/yyyy')) as fecha_inicio_prog3,
    //                         fu_get_cn_renovacion(a.id) as cn_r,
    //                         b.num_semanas, 
    //                         c.nombre, c.apellido_paterno, c.apellido_materno, 
    //                         c.calle, c.num_ext, l.nombre as colonia, c.telefono,
    //                         c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
    //                         i.nombre as zona,  
    //                         h.nombre as agencia,
    //                         e.nombre as tipo_contrato, 
    //                         f.nombre as tipo_credito, 
    //                         g.id as estatus_credito_id,
    //                         g.nombre as estatus_credito,
    //                         k.nombre as estatus_contrato,
    //                         a.locked,
    //                         a.renovacion,
    //                         a.preaprobado,
    //                         a.entregado,
    //                         a.no_entregado,
    //                         a.num_cheque,
    //                         a.motivo,
    //                         a.inversion_positiva,
    //                         fu_calcula_dias_penalizaciones(a.id) as dias_penalizaciones
    //                         FROM  
    //                         dbo.creditos a 
    //                         LEFT JOIN  
    //                         dbo.tarifas b 
    //                         on a.tarifa_id=b.id 
    //                         LEFT JOIN 
    //                         dbo.clientes c 
    //                         on a.cliente_id = c.id 
    //                         LEFT JOIN 
    //                         dbo.tipo_contrato e 
    //                         on a.tipo_contrato_id = e.id 
    //                         LEFT JOIN 
    //                         dbo.tipo_credito f 
    //                         on a.tipo_credito_id = f.id 
    //                         LEFT JOIN  
    //                         dbo.tipo_estatus_credito g 
    //                         on a.estatus_credito_id = g.id 
    //                         LEFT JOIN
    //                         dbo.tipo_estatus_contrato k
    //                         on a.estatus_contrato_id = k.id
    //                         INNER JOIN 
    //                         dbo.agencias h 
    //                         on c.agencia_id = h.id 
    //                         INNER JOIN 
    //                         dbo.zonas i 
    //                         on h.zona_id = i.id 
    //                         INNER JOIN 
    //                         dbo.sucursales j 
    //                         on i.sucursal_id = j.id 
    //                         INNER JOIN
    //                         dbo.solicitud_credito m
    //                         on a.solicitud_credito_id = m.id
    //                         INNER JOIN 
    //                         dbo.colonias l
    //                         on m.colonia_id = l.id `,

    getCreditosPreaprobados:    
        
                            `SELECT 
                            a.id, 
                            j.clave ||'-'|| a.cliente_id as num_cliente,
                            a.solicitud_credito_id,
                            a.cliente_id, 
                            a.num_contrato, 
                            TO_CHAR(a.monto_otorgado,'999,999D99') as monto_otorgado, 
                            TRUNC((a.monto_total / b.num_semanas),2) as monto_semanal,
                            fu_get_monto_total_creditos_preaprobados($1) as monto_total_creditos,
                            fu_get_cn_renovacion(a.id) as cn_r,
                            a.monto_total,
                            TO_CHAR(a.fecha_entrega_prog, 'DD/MM/YYYY') as fecha_entrega_prog,
                            a.fecha_creacion, a.fecha_inicio_prog, 
                            TO_CHAR(a.hora_entrega, 'HH24:MI') as hora_entrega, 
                            a.fecha_entrega_real, a.fecha_inicio_real,
                            a.tarifa_id, b.nombre as tarifa, b.num_semanas, 
                            c.nombre, c.apellido_paterno, c.apellido_materno, 
                            c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                            i.nombre as zona, h.nombre as agencia,
                            k.calle, k.num_ext, c.telefono,
                            l.nombre as colonia,
                            e.nombre as tipo_contrato, 
                            f.nombre as tipo_credito, 
                            g.nombre as estatus_credito,
                            a.locked,
                            a.renovacion,
                            a.preaprobado, a.entregado, a.no_entregado,
                            a.num_cheque, a.motivo
                            FROM  
                            dbo.creditos a 
                            LEFT JOIN  
                            dbo.tarifas b 
                            on a.tarifa_id=b.id 
                            LEFT JOIN 
                            dbo.clientes c 
                            on a.cliente_id = c.id 
                            LEFT JOIN 
                            dbo.tipo_contrato e 
                            on a.tipo_contrato_id = e.id 
                            LEFT JOIN 
                            dbo.tipo_credito f 
                            on a.tipo_credito_id = f.id 
                            LEFT JOIN  
                            dbo.tipo_estatus_credito g 
                            on a.estatus_credito_id = g.id 
                            INNER JOIN 
                            dbo.agencias h 
                            on c.agencia_id = h.id 
                            INNER JOIN 
                            dbo.zonas i 
                            on h.zona_id = i.id 
                            INNER JOIN 
                            dbo.sucursales j 
                            on i.sucursal_id = j.id 
                            INNER JOIN
                            dbo.solicitud_credito k
                            on a.solicitud_credito_id = k.id
                            INNER JOIN 
                            dbo.colonias l
                            on k.colonia_id = l.id
                            WHERE a.preaprobado = 1 
                            AND a.fecha_entrega_prog = $1
                            AND a.no_entregado IS NULL
                            ORDER BY a.no_entregado, h.zona_id, c.agencia_id, a.id, k.colonia_id`,

    getCredito:        `SELECT 
                        a.id, 
                        a.cliente_id,
                        k.clave ||'-'||a.cliente_id as num_cliente,
                        a.solicitud_credito_id,
                        a.num_contrato, a.monto_otorgado, a.monto_total, 
                        TRIM(TO_CHAR(a.monto_otorgado,'999,999D99')) as monto_otorgado2, 
                        fu_numero_letras(a.monto_total) as monto_total_letras,
                        ( 36 - b.num_semanas ) as dif_num_semanas,
                        ROUND((a.monto_total / b.num_semanas),2) as monto_semanal,
                        a.fecha_creacion, a.fecha_inicio_prog, a.hora_entrega, a.fecha_fin_prog, a.fecha_entrega_prog,  
                        TO_CHAR(a.fecha_entrega_prog,'DD-MM-YYYY') as fecha_entrega_prog2, 
                        TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog2, 
                        a.fecha_inicio_real, a.fecha_fin_real, a.fecha_entrega_real,
                        h.id as fuente_financ_id, 
                        b.id tarifa_id, 
                        b.cociente, b.num_semanas, 
                        c.nombre, c.apellido_paterno, c.apellido_materno,
                        j.nombre as zona, i.nombre as agencia,
                        l.calle, l.num_ext, UPPER(m.nombre) as colonia, m.cp, n.nombre as tipo_asentamiento, c.telefono, 
                        e.id as tipo_contrato_id, f.id as tipo_credito_id, 
                        g.nombre as estatus_credito,
                        a.locked,
                        a.renovacion,
                        a.entregado,
                        a.preaprobado,
                        a.inversion_positiva
                        FROM  
                        dbo.creditos a 
                        LEFT JOIN  
                        dbo.tarifas b on a.tarifa_id=b.id 
                        LEFT JOIN 
                        dbo.clientes c on a.cliente_id = c.id 
                        LEFT JOIN 
                        dbo.tipo_contrato e 
                        on a.tipo_contrato_id = e.id 
                        LEFT JOIN 
                        dbo.tipo_credito f 
                        on a.tipo_credito_id = f.id 
                        LEFT JOIN  
                        dbo.tipo_estatus_credito g 
                        on a.estatus_credito_id = g.id 
                        LEFT JOIN 
                        dbo.tipo_fuente_financiamiento h 
                        on a.fuente_financ_id = h.id 
                        INNER JOIN
                        dbo.agencias i 
                        on c.agencia_id = i.id
                        INNER JOIN
                        dbo.zonas j on 
                        i.zona_id = j.id
                        INNER JOIN
                        dbo.sucursales k 
                        on j.sucursal_id = k.id
                        INNER JOIN
                        dbo.solicitud_credito l 
                        on a.solicitud_credito_id = l.id
                        INNER JOIN
                        dbo.colonias m
                        on m.id = l.colonia_id
                        INNER JOIN
                        dbo.tipo_asentamiento n
                        on m.tipo_asentamiento_id = n.id
                        WHERE a.id = $1 `,

    deleteCredito:      'DELETE FROM dbo.creditos WHERE id = $1 RETURNING *',
    
    getTipoContratos:   'SELECT * FROM dbo.tipo_contrato order by nombre',
    getTipoContrato:    'SELECT * FROM dbo.tipo_contrato WHERE id = $1',
    insertTipoContrato: 'INSERT INTO dbo.tipo_contrato (nombre) VALUES($1) RETURNING *',
    updateTipoContrato: 'UPDATE dbo.tipo_contrato set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoContrato: 'DELETE FROM dbo.tipo_contrato WHERE id = $1 RETURNING *',
    
    getTipoCreditos:    'SELECT * FROM dbo.tipo_credito order by nombre',
    getTipoCredito:     'SELECT * FROM dbo.tipo_credito WHERE id = $1',
    insertTipoCredito:  'INSERT INTO dbo.tipo_credito (nombre) VALUES($1) RETURNING *',
    updateTipoCredito:  'UPDATE dbo.tipo_credito set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoCredito:  'DELETE FROM dbo.tipo_credito WHERE id = $1 RETURNING *',

    getTipoIds:         'SELECT a.id, a.nombre FROM dbo.tipo_identificacion a order by a.nombre',
    getTipoIdentif:     'SELECT * FROM dbo.tipo_identificacion WHERE id = $1',
    insertTipoIdentif:  'INSERT INTO dbo.tipo_identificacion (nombre) VALUES($1) RETURNING *',
    updateTipoIdentif:  'UPDATE dbo.tipo_identificacion set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoIdentif:  'DELETE FROM dbo.tipo_identificacion WHERE id = $1 RETURNING *',

    getTipoEstatusCreditos:             'SELECT id, nombre FROM dbo.tipo_estatus_credito order by nombre',
    getTipoEstatusCredito:              'SELECT * FROM dbo.tipo_estatus_credito WHERE id = $1',
    insertTipoEstatusCredito:           'INSERT INTO dbo.tipo_estatus_credito (nombre) VALUES($1) RETURNING *',
    updateTipoEstatusCredito:           'UPDATE dbo.tipo_estatus_credito set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoEstatusCredito:           'DELETE FROM dbo.tipo_estatus_credito WHERE id = $1 RETURNING *',

    getTipoParentescos:                 'SELECT * FROM dbo.tipo_parentesco order by nombre',
    getTipoParentesco:                  'SELECT * FROM dbo.tipo_parentesco WHERE id = $1',
    insertTipoParentesco:               'INSERT INTO dbo.tipo_parentesco (nombre) VALUES($1) RETURNING *',
    updateTipoParentesco:               'UPDATE dbo.tipo_parentesco set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoParentesco:               'DELETE FROM dbo.tipo_parentesco WHERE id = $1 RETURNING *',
    
    getTipoAsentamientos:               'SELECT * FROM dbo.tipo_asentamiento order by nombre',
    getTipoAsentamiento:                'SELECT * FROM dbo.tipo_asentamiento WHERE id = $1',
    insertTipoAsentamiento:             'INSERT INTO dbo.tipo_asentamiento (nombre, abreviatura) VALUES($1, $2) RETURNING *',
    updateTipoAsentamiento:             'UPDATE dbo.tipo_asentamiento set nombre = $1, abreviatura = $2 WHERE id = $3 RETURNING *',
    deleteTipoAsentamiento:             'DELETE FROM dbo.tipo_asentamiento WHERE id = $1 RETURNING *',

    getTipoEmpleos:                     `SELECT 
                                        a.id, a.nombre 
                                        FROM 
                                        dbo.tipo_empleo a
                                        ORDER BY a.nombre`,

    getTipoEmpleo:                     `SELECT 
                                        a.id, a.nombre 
                                        FROM 
                                        dbo.tipo_empleo a
                                        WHERE a.id = $1 `,

    insertTipoEmpleo:                   `INSERT INTO dbo.tipo_empleo (nombre) VALUES($1) RETURNING *`,
    updateTipoEmpleo:                   `UPDATE dbo.tipo_empleo set nombre = $1 WHERE id = $2 RETURNING *`,
    deleteTipoEmpleo:                   `DELETE FROM dbo.tipo_empleo WHERE id = $1 RETURNING *`,

    getTipoEstatusContratos:            'SELECT * FROM dbo.tipo_estatus_contrato order by nombre',
    getTipoEstatusContrato:             'SELECT * FROM dbo.tipo_estatus_contrato WHERE id = $1',
    insertTipoEstatusContrato:          'INSERT INTO dbo.tipo_estatus_contrato (nombre) VALUES($1) RETURNING *',
    updateTipoEstatusContrato:          'UPDATE dbo.tipo_estatus_contrato set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoEstatusContrato:          'DELETE FROM dbo.tipo_estatus_contrato WHERE id = $1 RETURNING *',

    getTipoEstatusSolicitudes:          'SELECT * FROM dbo.tipo_estatus_solicitud order by nombre',
    getTipoEstatusSolicitud:            'SELECT * FROM dbo.tipo_estatus_solicitud WHERE id = $1',
    insertTipoEstatusSolicitud:         'INSERT INTO dbo.tipo_estatus_solicitud (nombre) VALUES($1) RETURNING *',
    updateTipoEstatusSolicitud:         'UPDATE dbo.tipo_estatus_solicitud set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoEstatusSolicitud:         'DELETE FROM dbo.tipo_estatus_solicitud WHERE id = $1 RETURNING *',

    getTipoFuenteFinanciamientos:       'SELECT * FROM dbo.tipo_fuente_financiamiento order by nombre',
    getTipoFuenteFinanciamiento:        'SELECT * FROM dbo.tipo_fuente_financiamiento WHERE id = $1',
    insertTipoFuenteFinanciamiento:     'INSERT INTO dbo.tipo_fuente_financiamiento (nombre) VALUES($1) RETURNING *',
    updateTipoFuenteFinanciamiento:     'UPDATE dbo.tipo_fuente_financiamiento set nombre = $1 WHERE id = $2 RETURNING *',
    deleteTipoFuenteFinanciamiento:     'DELETE FROM dbo.tipo_fuente_financiamiento WHERE id = $1 RETURNING *',

    getBlacklist:                       "SELECT b.* FROM dbo.blacklist a INNER JOIN dbo.clientes b on a.cliente_id = b.id ",

    deleteBlackListByUserId:            "DELETE FROM dbo.blacklist WHERE cliente_id = $1 RETURNING*",

    getParentelaByClienteId:            `SELECT a.id, a.nombre, c.nombre as parentesco, to_char(a.fecha_nacimiento,'dd-MM-yyyy') as fecha_nacimiento 
                                        FROM dbo.cliente_parentela a 
                                        INNER JOIN 
                                        dbo.clientes b 
                                        on a.cliente_id= b.id 
                                        INNER JOIN "+
                                        dbo.tipo_parentesco c 
                                        on a.tipo_parentesco_id = c.id 
                                        WHERE a.cliente_id = $1`,

    insertParentela:                    `INSERT INTO dbo.cliente_parentela 
                                        (cliente_id, nombre, tipo_parentesco_id, fecha_nacimiento) 
                                        VALUES($1,$2,$3,$4) RETURNING * `,

    getAmortizacion:                    `SELECT
                                        a.id as credito_id,
                                        a.fecha_inicio_prog,
                                        a.fecha_inicio_real,
                                        a.monto_otorgado,
                                        a.monto_total,
                                        c.monto_semanal,
                                        c.num_semanas,
                                        a.inversion_positiva,
                                        a.aux_num_penalizaciones,
                                        c.bonificaciones
                                        FROM 
                                        dbo.creditos a
                                        INNER JOIN
                                        dbo.solicitud_credito b
                                        on a.solicitud_credito_id = b.id
                                        INNER JOIN
                                        dbo.tarifas c
                                        on a.tarifa_id = c.id
                                        WHERE a.id = $1`,

    getBalance:                         `SELECT 
                                        SUM(adeudo_semanal) as adeudo_restante,
                                        SUM(recargo_semanal) as total_recargos,
                                        SUM(adeudo_semanal) + SUM(recargo_semanal) as grand_total,
                                        TRIM(TO_CHAR(SUM(adeudo_semanal) + SUM(recargo_semanal),'999,999,999D99')) as grand_total2,
                                        TRIM(TO_CHAR(SUM(adeudo_Semanal),'999,999,999D99')) as adeudo_restante2,
                                        TRIM(TO_CHAR(SUM(recargo_semanal),'999,999,999D99')) as total_recargos2
                                        FROM dbo.balance_semanal 
                                        WHERE credito_id = $1`,

    queryPrintContrato:                 `SELECT
                                        a.num_contrato,
                                        TO_CHAR(a.fecha_fin_prog, 'DD-MM-YYYY') as fecha_fin,
                                        b.nombre||' '||b.apellido_paterno||' '||b.apellido_materno as nombre_completo,
                                        b.rfc, b.curp, b.telefono, b.email,
                                        LPAD(EXTRACT (DAY FROM b.fecha_nacimiento)::text, 2, '0') as dia_fecha_nacimiento,
                                        fu_get_month_letras(b.fecha_nacimiento) as mes_fecha_nacimiento,
                                        EXTRACT (YEAR FROM b.fecha_nacimiento) as año_fecha_nacimiento,
                                        TO_CHAR(b.fecha_nacimiento, 'DD-MM-YYYY') as fecha_nacimiento, 
                                        b.calle, b.num_ext, 
                                        INITCAP(g.nombre) as tipo_asentamiento, 
                                        UPPER(f.nombre) as colonia, f.cp,
                                        d.nombre as ocupacion,
                                        TRIM(TO_CHAR( (a.monto_total / e.num_semanas ) , '999,999D99')) as monto_semanal,
                                        TRIM(TO_CHAR(a.monto_otorgado, '999,999D99')) as monto_otorgado,
                                        TRIM(TO_CHAR(a.monto_total, '999,999D99')) as monto_total,
                                        fu_numero_letras(a.monto_total) as monto_total_letras,
                                        EXTRACT (DAY FROM a.fecha_fin_prog) as dia_fin, 
                                        fu_get_month_letras(a.fecha_fin_prog) as mes_letra_fin,
                                        EXTRACT (YEAR FROM a.fecha_fin_prog) as año_fin, 
                                        e.num_semanas
                                        FROM dbo.creditos a 
                                        INNER JOIN 
                                        dbo.clientes b 
                                        on a.cliente_id = b.id
                                        INNER JOIN 
                                        dbo.solicitud_credito c
                                        on c.id = a.solicitud_credito_id
                                        INNER JOIN dbo.ocupaciones d
                                        on c.ocupacion_id = d.id
                                        INNER JOIN
                                        dbo.tarifas e
                                        on e.id = a.tarifa_id
                                        INNER JOIN
                                        dbo.colonias f
                                        on c.colonia_id = f.id
                                        INNER JOIN
                                        dbo.tipo_asentamiento g
                                        on g.id = f.tipo_asentamiento_id
                                        WHERE a.id = $1`,

    queryPrintAmorti:                   `SELECT b.id as credito_id, a.num_semana,
                                        EXTRACT(DAY from a.fecha_inicio_valida) as dia_pago,
                                        TO_CHAR(a.fecha_inicio_valida,'MM') as mes_pago,
                                        fu_get_month_letras(a.fecha_fin_valida :: date) as mes_letra_fin,
                                        EXTRACT(YEAR from a.fecha_fin_valida) as año_pago,
                                        TRIM(
                                        TO_CHAR((b.monto_total / c.num_semanas) +
                                        (b.monto_total / c.num_semanas) *
                                        ( (SELECT count(*) from dbo.balance_semanal a where a.credito_id = $1) - a.num_semana ),'999,999D99')) as amortizacion,
                                        
                                        TRIM(TO_CHAR((b.monto_total / c.num_semanas),'999,999D99')) as monto_semanal,
                                        
                                        '$' || TRIM(TO_CHAR((b.monto_total / c.num_semanas) *
                                        ( (select count(*) from dbo.balance_semanal a where a.credito_id = $1) - a.num_semana ),'999,999D99')) as monto_fin_periodo
                                        FROM dbo.balance_semanal a 
                                        INNER JOIN
                                        dbo.creditos b 
                                        on a.credito_id = b.id
                                        INNER JOIN
                                        dbo.tarifas c
                                        on b.tarifa_id = c.id
                                        WHERE a.credito_id = $1
                                        ORDER by a.num_semana`,

    getEventosByCreditoId:              `SELECT usuario, evento, observacion, fecha
                                        FROM dbo.solicitud_eventos 
                                        WHERE solicitud_credito_id = $1 ORDER BY fecha DESC`,
                                
    resetPassword:                      `UPDATE dbo.usuarios 
                                        SET password = $1 WHERE id = $2;`,

    getSolCreditoQueryGenerica:         `SELECT a.id, 
                                        a.estatus_sol_id,
                                        a.cliente_id,
                                        a.monto, a.tarifa_id,
                                        b.apellido_paterno, b.apellido_materno, b.nombre, 
                                        TRIM(b.apellido_paterno||' '||b.apellido_materno||' '||COALESCE(b.nombre,'')) as nombre_completo,
                                        a.fecha_solicitud, c.nombre as estatus,
                                        a.locked,
                                        d.id as agencia_id,
                                        d.nombre as agencia,
                                        e.nombre as zona,
                                        e.id as zona_id
                                        FROM 
                                        dbo.solicitud_credito a
                                        INNER JOIN
                                        dbo.clientes b
                                        on a.cliente_id = b.id
                                        INNER JOIN
                                        dbo.tipo_estatus_solicitud c
                                        on a.estatus_sol_id = c.id 
                                        INNER JOIN
                                        dbo.agencias d
                                        on b.agencia_id = d.id
                                        INNER JOIN
                                        dbo.zonas e
                                        on d.zona_id = e.id`,

    getCreditoQueryGenerica:            `SELECT 
                                        a.id, 
                                        a.cliente_id,
                                        k.clave ||'-'||a.cliente_id as num_cliente,
                                        a.solicitud_credito_id,
                                        a.num_contrato, a.monto_otorgado, a.monto_total, 
                                        TRIM(TO_CHAR(a.monto_otorgado,'999,999D99')) as monto_otorgado2, 
                                        fu_numero_letras(a.monto_total) as monto_total_letras,
                                        ROUND((a.monto_total / b.num_semanas),2) as monto_semanal,
                                        a.fecha_creacion, a.fecha_inicio_prog, a.hora_entrega, a.fecha_fin_prog, a.fecha_entrega_prog,  
                                        TO_CHAR(a.fecha_entrega_prog,'DD-MM-YYYY') as fecha_entrega_prog2, 
                                        TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog2, 
                                        a.fecha_inicio_real, a.fecha_fin_real, a.fecha_entrega_real,
                                        h.id as fuente_financ_id, 
                                        b.id tarifa_id, 
                                        b.cociente, b.num_semanas, 
                                        c.nombre, c.apellido_paterno, c.apellido_materno,
                                        c.nombre||' '||c.apellido_paterno||' '||c.apellido_materno as nombre_completo,
                                        j.nombre as zona, k.nombre as agencia,
                                        l.calle, l.num_ext, UPPER(m.nombre) as colonia, m.cp, n.nombre as tipo_asentamiento, c.telefono, 
                                        e.id as tipo_contrato_id, f.id as tipo_credito_id, 
                                        g.nombre as estatus_credito,
                                        o.nombre as estatus_contrato,
                                        a.num_cheque,
                                        a.locked,
                                        a.renovacion,
                                        a.entregado,
                                        a.preaprobado,
                                        a.inversion_positiva
                                        FROM  
                                        dbo.creditos a 
                                        LEFT JOIN  
                                        dbo.tarifas b on a.tarifa_id=b.id 
                                        LEFT JOIN 
                                        dbo.clientes c on a.cliente_id = c.id 
                                        LEFT JOIN 
                                        dbo.tipo_contrato e 
                                        on a.tipo_contrato_id = e.id 
                                        LEFT JOIN 
                                        dbo.tipo_credito f 
                                        on a.tipo_credito_id = f.id 
                                        LEFT JOIN  
                                        dbo.tipo_estatus_credito g 
                                        on a.estatus_credito_id = g.id 
                                        LEFT JOIN 
                                        dbo.tipo_fuente_financiamiento h 
                                        on a.fuente_financ_id = h.id 
                                        INNER JOIN
                                        dbo.agencias i 
                                        on c.agencia_id = i.id
                                        INNER JOIN
                                        dbo.zonas j on 
                                        i.zona_id = j.id
                                        INNER JOIN
                                        dbo.sucursales k 
                                        on j.sucursal_id = k.id
                                        INNER JOIN
                                        dbo.solicitud_credito l 
                                        on a.solicitud_credito_id = l.id
                                        INNER JOIN
                                        dbo.colonias m
                                        on m.id = l.colonia_id
                                        INNER JOIN
                                        dbo.tipo_asentamiento n
                                        on m.tipo_asentamiento_id = n.id
                                        LEFT JOIN 
                                        dbo.tipo_estatus_contrato o
                                        on a.estatus_contrato_id = o.id`,

    getClienteQueryGenerica:            `SELECT 
                                        a.id, a.num_cliente, 
                                        d.clave||'-'||a.num_cliente as num_cliente2, 
                                        a.nombre||' '||a.apellido_paterno||' '||a.apellido_materno as nombre_completo, 
                                        a.nombre, a.apellido_paterno, a.apellido_materno, 
                                        a.telefono, a.curp, a.rfc, a.fecha_nacimiento, a.sexo, a.email,
                                        b.nombre as agencia, c.nombre as zona,
                                        fu_calcula_num_creditos_by_cliente(a.id) as num_creditos
                                        FROM 
                                        dbo.clientes a
                                        INNER JOIN
                                        dbo.agencias b
                                        on a.agencia_id = b.id
                                        INNER JOIN
                                        dbo.zonas c
                                        on b.zona_id = c.id
                                        INNER JOIN
                                        dbo.sucursales d
                                        on c.sucursal_id = d.id`,

    getDashboardCounters: ``,

    getReporteCartas:                   `
                                SELECT 
                                c.id as id,
                                e.nombre as agencia,
                                f.nombre as zona,
                                c.num_contrato, 
                                c.fecha_inicio_real,
                                TO_CHAR(c.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
                                TRIM(TO_CHAR(( c.monto_total / g.num_semanas),'999,999D99')) as monto_semanal,
                                TRIM(TO_CHAR(c.monto_otorgado,'999,999D99')) as monto_otorgado, 
                                h.nombre as estatus,
                                d.nombre || ' ' || d.apellido_paterno || ' ' || d.apellido_materno as nombre_completo,
                                c.monto_total as monto_total,
                                fu_calcula_total_penalizaciones(c.id) as total_penalizaciones,
                                COALESCE(fu_calcula_suma_total_pagado_by_credito_id(c.id),0) as total_pagado,
                                TRIM(TO_CHAR(((fu_calcula_total_penalizaciones(c.id) + c.monto_total ) - COALESCE(fu_calcula_suma_total_pagado_by_credito_id(c.id),0) ),'999,999D99')) as total_liquidar
                                FROM 
                                dbo.semanas a
                                inner join 
                                dbo.balance_semanal b
                                on a.fecha_inicio = b.fecha_inicio AND a.fecha_fin = b.fecha_fin and a.weekyear = b.weekyear
                                inner join 
                                dbo.creditos c
                                on c.id = b.credito_id
                                inner join dbo.clientes d
                                on d.id = c.cliente_id
                                INNER JOIN
                                dbo.agencias e
                                on e.id = d.agencia_id
                                INNER JOIN
                                dbo.zonas f
                                on f.id = e.zona_id
                                INNER JOIN 
                                dbo.tarifas g
                                on g.id = c.tarifa_id
                                INNER JOIN
                                dbo.tipo_estatus_credito h 
                                on h.id = c.tipo_credito_id AND h.id != 1 
                                WHERE a.id = $1
                                ORDER BY f.id ASC, e.id ASC`,

    // getReporteCartasOptimizado:                   `
    //                             SELECT 
    //                             c.id as id,
    //                             e.nombre as agencia,
    //                             f.nombre as zona,
    //                             c.num_contrato, 
    //                             c.num_contrato_historico,
    //                             c.fecha_inicio_real,
    //                             g.num_semanas,
    //                             TO_CHAR(c.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
    //                             g.monto_semanal as monto_semanal,
    //                             c.monto_otorgado, 
    //                             h.nombre as estatus,
    //                             d.nombre || ' ' || d.apellido_paterno || ' ' || d.apellido_materno as nombre_completo,
    //                             (g.monto_semanal * g.num_semanas)as monto_total,
    //                             COALESCE(c.aux_num_penalizaciones,0) as aux_num_penalizaciones,
    //                             c.inversion_positiva
    //                             FROM 
    //                             dbo.semanas a
    //                             inner join 
    //                             dbo.balance_semanal b
    //                             on a.fecha_inicio = b.fecha_inicio AND a.fecha_fin = b.fecha_fin and a.weekyear = b.weekyear
    //                             inner join 
    //                             dbo.creditos c
    //                             on c.id = b.credito_id
    //                             inner join dbo.clientes d
    //                             on d.id = c.cliente_id
    //                             INNER JOIN
    //                             dbo.agencias e
    //                             on e.id = d.agencia_id
    //                             INNER JOIN
    //                             dbo.zonas f
    //                             on f.id = e.zona_id
    //                             INNER JOIN 
    //                             dbo.tarifas g
    //                             on g.id = c.tarifa_id
    //                             INNER JOIN
    //                             dbo.tipo_estatus_credito h 
    //                             on h.id = c.estatus_credito_id AND h.id != 1 
    //                             WHERE a.id = $1 
    //                             ORDER BY f.nombre ASC, e.nombre ASC, d.nombre
    //                             `,

    getReporteCartasOptimizado:                   `
                                SELECT 
                                c.id as id,
                                e.nombre as agencia,
                                f.nombre as zona,
                                c.num_contrato, 
                                c.num_contrato_historico,
                                c.fecha_inicio_real,
                                g.num_semanas,
                                TO_CHAR(c.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
                                g.monto_semanal as monto_semanal,
                                c.monto_otorgado, 
                                h.nombre as estatus,
                                d.nombre || ' ' || d.apellido_paterno || ' ' || d.apellido_materno as nombre_completo,
                                (g.monto_semanal * g.num_semanas)as monto_total,
                                COALESCE(c.aux_num_penalizaciones,0) as aux_num_penalizaciones,
                                c.inversion_positiva
                                FROM 
                                dbo.semanas a
                                left join 
                                dbo.balance_semanal b
                                on b.fecha_fin <= a.fecha_fin and a.weekyear = b.weekyear
                                inner join 
                                dbo.creditos c
                                on c.id = b.credito_id
                                inner join dbo.clientes d
                                on d.id = c.cliente_id
                                INNER JOIN
                                dbo.agencias e
                                on e.id = d.agencia_id
                                INNER JOIN
                                dbo.zonas f
                                on f.id = e.zona_id
                                INNER JOIN 
                                dbo.tarifas g
                                on g.id = c.tarifa_id
                                INNER JOIN
                                dbo.tipo_estatus_credito h 
                                on h.id = c.estatus_credito_id AND h.id = 2 
                                WHERE a.id = $1 
                                ORDER BY f.nombre ASC, e.nombre ASC, d.nombre
                                `,

    // getReporteCartasUNION: `

    // (SELECT 
    // a.id,
    // a.fecha_inicio_real,
    // f.nombre as zona,
    // e.nombre as agencia,
    // a.num_contrato,
    // a.num_contrato_historico,
    // g.nombre ||' '||g.apellido_paterno ||' '||g.apellido_materno as nombre_completo,
    // h.monto_semanal,
    // TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
    // i.nombre as estatus
    // FROM 
    //     dbo.creditos a
    // INNER JOIN 
    //     dbo.balance_semanal b ON a.id = b.credito_id
    // INNER JOIN 
    //     dbo.semanas c 
    //     ON b.fecha_inicio = c.fecha_inicio 
    //     AND b.fecha_fin = c.fecha_fin 
    //     AND b.weekyear = c.weekyear
    // INNER JOIN
    //     dbo.solicitud_credito d ON a.solicitud_credito_id = d.id
    // INNER JOIN
    //     dbo.agencias e ON d.agencia_id = e.id
    // INNER JOIN
    //     dbo.zonas f ON e.zona_id = f.id
    // INNER JOIN
    //     dbo.clientes g ON a.cliente_id = g.id
    // INNER JOIN
    //     dbo.tarifas h ON a.tarifa_id = h.id
    // INNER JOIN
    //     dbo.tipo_estatus_credito i ON a.estatus_credito_id = i.id
    // WHERE 
    //     c.id = $1
    //     AND a.estatus_credito_id = 2)

    // UNION

    // (SELECT 
    //     a.id,
    //     a.fecha_inicio_real,
    //     f.nombre as zona,
    //     e.nombre as agencia,
    //     a.num_contrato,
    //     a.num_contrato_historico,
    //     g.nombre ||' '||g.apellido_paterno ||' '||g.apellido_materno as nombre_completo,
    //     h.monto_semanal,
    //     TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
    //     i.nombre as estatus
    // FROM 
    //     dbo.creditos a
    // LEFT JOIN 
    //     dbo.balance_semanal b ON a.id = b.credito_id
    // LEFT JOIN 
    //     dbo.semanas c 
    //     ON b.fecha_inicio = c.fecha_inicio 
    //     AND b.fecha_fin = c.fecha_fin 
    //     AND b.weekyear = c.weekyear
    // LEFT JOIN
    //     dbo.solicitud_credito d ON a.solicitud_credito_id = d.id
    // LEFT JOIN
    //     dbo.agencias e ON d.agencia_id = e.id
    // LEFT JOIN
    //     dbo.zonas f ON e.zona_id = f.id
    // LEFT JOIN
    //     dbo.clientes g ON a.cliente_id = g.id
    // LEFT JOIN
    //     dbo.tarifas h ON a.tarifa_id = h.id
    // LEFT JOIN
    //     dbo.tipo_estatus_credito i ON a.estatus_credito_id = i.id
    // WHERE 
    //     c.id IS NULL 
    //     AND a.estatus_credito_id = 2 
    //     AND (SELECT MAX(fecha_fin) FROM dbo.balance_semanal WHERE credito_id = a.id) < (SELECT fecha_fin FROM dbo.semanas WHERE id = $1 )
    // )
    // ORDER BY zona, agencia, nombre_completo
    
    // `

    getReporteCartasUNION: `
    
    (SELECT 
        a.credito_id,
        a.fecha_inicio_real,
        a.zona,
        a.agencia,
        a.num_contrato,
        a.num_contrato_historico,
        a.nombre_completo,
        a.monto as monto_otorgado,
        a.monto_semanal,
        TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
        a.estatus_credito_id,
        a.estatus_credito,
        a.monto_total,
 		COALESCE(a.monto_total_pagado,0) as monto_total_pagado,
        (a.monto_total - COALESCE(a.monto_total_pagado,0) ) as monto_total_restante,
        a.total_penalizaciones
        FROM 
            dbo.vwm_creditos a
        INNER JOIN 
            dbo.balance_semanal b 
            ON a.credito_id = b.credito_id
        INNER JOIN 
            dbo.semanas c 
            ON b.fecha_inicio = c.fecha_inicio 
            AND b.fecha_fin = c.fecha_fin 
            AND b.weekyear = c.weekyear
        WHERE 
            c.id = $1
            
    UNION
    
    SELECT
        a.credito_id,
        a.fecha_inicio_real,
        a.zona,
        a.agencia,
        a.num_contrato,
        a.num_contrato_historico,
        a.nombre_completo,
        a.monto as monto_otorgado,
        a.monto_semanal,
        TO_CHAR(a.fecha_fin_prog,'DD-MM-YYYY') as fecha_fin_prog, 
        a.estatus_credito_id,
        a.estatus_credito,
        a.monto_total,
        COALESCE(a.monto_total_pagado,0) as monto_total_pagado,
        (a.monto_total - COALESCE(a.monto_total_pagado,0) ) as monto_total_restante,
        a.total_penalizaciones
    FROM 
 		dbo.vwm_creditos a
    JOIN 
 		dbo.semanas c 
        ON a.fecha_fin_prog <= c.fecha_inicio
    WHERE c.id = $1
 	AND a.estatus_credito_id = 2 

    )
            ORDER BY zona, agencia, nombre_completo
    
    `,

    getPenalizacionesByCreditoId: `
    SELECT SUM(recargo_semanal) as penalizaciones
    FROM dbo.balance_semanal 
    WHERE credito_id = $1 AND transcurrida = 1
    
    `
}

module.exports = {
    queries
}