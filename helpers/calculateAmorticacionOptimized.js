
const pool = require('../database/connection');
const Pago = require('../models/pago');


const generateAmortizacionOptimizada = async (result = []) => {

    try {

        console.log('INICIAMOSSSSS!!!!');

        console.log('iniciamos');
        console.log(result[0]);

        //Obtenemos datos del credito
        const credito_id = result[0]['credito_id'];
        const monto_otorgado = Number(result[0]['monto_otorgado']);
        let monto_total = Number(result[0]['monto_total']);
        let semanas = [];
        //const fecha_inicial = result['fecha_inicio_prog'];
        const fecha_inicial = result[0]['fecha_inicio_real'];
        let monto_semanal = result[0]['monto_semanal'];
        const inversion_positiva = result[0]['inversion_positiva'];
        const cliente_cump = await pool.query(`SELECT fu_get_cliente_cumplido(${credito_id})`);

        const { fu_get_cliente_cumplido } = cliente_cump.rows[0];
        const cliente_cumplido = fu_get_cliente_cumplido;

        //Penalizaciones traidas de la base de Israel
        const penalizaciones_auxiliares = result[0]['aux_num_penalizaciones'];


        //TOTALES
        let penalizacion_total = 0;
        let pagado_total = 0;
        let grand_total = null;
        let fecha_ultimo_pago = null;
        let fechaHoy = new Date();
        //fechaHoy = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate() + 15 );
        let fechaToCompare;

        //La tabla balance_final debe tener cuando un usuario ya termino de pagar, hay que buscar el momento idóneo para que 
        //se inserte el registro en esta tabla y ya no se puedan seguir calculando las penalizaciones.
        //Preguntamos si ya termino de pagar, si YA
        //usamos la fecha tope si no usamos la fecha de consulta 
        const { rows } = await pool.query(`
            SELECT grand_total, fecha_finalizacion
            FROM dbo.balance_final a
            WHERE a.credito_id = ${credito_id}
        `);

        if (rows.length) {
            console.log('Ya terminó de pagar');
            fecha_ultimo_pago = rows[0]['fecha_finalizacion'];
            //fechaToCompare = new Date(rows[0]['fecha_finalizacion']);
            fechaToCompare = new Date();
        } else {
            console.log('no ha terminado pagar!!');

            fechaToCompare = new Date();
        }

        //El getDate() + 2 permite simular cualquier día sumando o restando dias a la fecha actual 
        fechaToCompare = new Date(fechaToCompare.getFullYear(), fechaToCompare.getMonth(), fechaToCompare.getDate());

        console.log('fechaToCompare', fechaToCompare);
        let num_semana = 1;

        ////En este bloque calculamos la semana del año, para eso tomamos la fecha inicial y un dia deespues para que solo delimite una semana del resultado de la query
        //Esto evita que se traslapen las fechas
        let fechaWeekyear = new Date(fecha_inicial);

        console.log('Fecha de la semana:', fechaWeekyear);

        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        fechaFormateada = fechaWeekyear.toISOString('es-ES', options).replace(/\//g, '-').slice(0, 10);

        let fechaWeekyear2 = fechaWeekyear;
        fechaWeekyear.setDate(fechaWeekyear.getDate());
        fechaWeekyear2.setDate(fechaWeekyear.getDate() + 1);

        fechaFormateada2 = fechaWeekyear.toISOString('es-ES', options).replace(/\//g, '-').slice(0, 10);

        //fechaWeekyear = fechaWeekyear.toISOString().slice(0, 10);
        //fechaWeekyear2 = fechaWeekyear2.toISOString().slice(0, 10);


        //Fecha Formateada2 es fecha formateada mas 1 día, esto con el fin de eliminar que se traslapen las semanas
        const resultado_weekyear = await pool.query(`
        SELECT a.weekyear
            FROM dbo.semanas a
            WHERE '${fechaFormateada}' >= a.fecha_inicio AND '${fechaFormateada}' <= a.fecha_fin
            AND '${fechaFormateada2}' >= a.fecha_inicio AND '${fechaFormateada2}' <= a.fecha_fin
        `);

        console.log(resultado_weekyear.rows);


        let semana_weekyear = 0;

        if (resultado_weekyear.rows.length > 0) {
            semana_weekyear = resultado_weekyear?.rows[0]['weekyear'];
        }

        let remanente = 0;

        //Hacemos el For de la amortizacion
        for (let i = 0; i < result[0]['num_semanas']; i++) {

            console.log('////////////////////////////');
            console.log('num de semana: ', num_semana);

            //Estas variables tienen que reiniciarse cada loop, por eso están aquí.
            let dias_penalizacion = null;
            let penalizacion_semanal = null;
            let suma_monto_pagado = null;
            let adeudo_semanal = null;
            let pago_cubierto = null;
            let transcurrida = null;
            let transcurriendo = null;

            //intentando sumar un día aquí estaba y todo marchaba bien pero no pude sumar un día, lo tueve que sacar del for
            //fechaToCompare = new Date(fechaToCompare.getFullYear(), fechaToCompare.getMonth(), fechaToCompare.getDate() + 1 );

            let fecha = new Date(fecha_inicial);
            let fechac1 = fecha;
            fecha.setDate(fecha.getDate() + (i * 7));
            fecha = fecha.toISOString().slice(0, 10);

            let fecha2 = new Date(fecha);
            let fechac2 = fecha2;

            //fecha2.setDate(fecha2.getDate() + (6)); //Este funciona pero solo establece el limite de Martes a Lunes
            fecha2.setDate(fecha2.getDate() + (7));
            fecha2 = fecha2.toISOString().slice(0, 10);

            let fec1 = new Date(fechac1.getFullYear(), fechac1.getMonth(), fechac1.getDate());
            let fec2 = new Date(fechac2.getFullYear(), fechac2.getMonth(), fechac2.getDate() + 1);


            if ((Date.parse(fechaHoy) >= Date.parse(fec1)) && (Date.parse(fechaHoy) <= Date.parse(fec2))) {
                transcurriendo = 1;
            } else {
                transcurriendo = 0;
            }

            if ((Date.parse(fechaHoy) > Date.parse(fec2))) {
                transcurrida = 1;
            } else {
                transcurrida = 0;
            }

            console.log('transcurrida', transcurrida);
            console.log('transcurriendo', transcurriendo);

            //Reiniciamos el contador de semanas con cambios de año
            if (semana_weekyear > 52) {
                semana_weekyear = 1;
            }

            console.log('weekyear', semana_weekyear);

            //console.log(fechaToCompare);
            console.log('Fec1', fec1);
            console.log('Fec2', fec2);


            //Calculamos la fecha en que inician los recargos
            let fecha_inicio_recargo = new Date(fecha);
            fecha_inicio_recargo.setDate(fecha_inicio_recargo.getDate() + (2));
            fecha_inicio_recargo = fecha_inicio_recargo.toISOString().slice(0, 10);

            let fecha_fin_recargo = new Date(fecha2);
            fecha_fin_recargo.setDate(fecha_fin_recargo.getDate());
            fecha_fin_recargo = fecha_fin_recargo.toISOString().slice(0, 10);


            console.log('fecha1:', fecha);
            console.log('fecha2:', fecha2);

            console.log(semana_weekyear);

            let query = `SELECT 
                    a.credito_id,
                    b.weekyear,
                    b.num_semana,
                    a.folio,
                    a.monto as monto_pagado,
                    (SELECT 
                        SUM(z.monto) as suma_monto_pagado
                        FROM dbo.pagos z
                        INNER JOIN 
                        dbo.balance_semanal x 
                        ON z.credito_id = x.credito_id 
                        AND z.cancelado IS NULL
                        AND z.fecha >= x.fecha_inicio AND z.fecha <= x.fecha_fin
                        AND z.fecha BETWEEN  '${fecha}' AND '${fecha2}'
                        AND z.weekyear = x.weekyear
                        AND z.weekyear = ${semana_weekyear}
                        AND z.credito_id = ${credito_id}
                    ) as suma_monto_pagado,
                    (SELECT 
                        COALESCE(SUM(z.monto),0) 
                        FROM dbo.pagos z
                        INNER JOIN 
                        dbo.balance_semanal x 
                        ON z.credito_id = x.credito_id 
                        AND z.cancelado IS NULL
                        AND z.fecha >= x.fecha_inicio_valida 
                        AND z.fecha <= x.fecha_fin_valida
                        AND z.fecha BETWEEN  '${fecha}' AND '${fecha2}'
                        AND z.weekyear = x.weekyear
                        AND z.weekyear = ${semana_weekyear}
                        AND z.credito_id = ${credito_id}
                    ) as suma_monto_pagado_valido,
                    (SELECT 
                        z.id
                        FROM dbo.pagos z
                        INNER JOIN 
                        dbo.balance_semanal x 
                        ON z.credito_id = x.credito_id 
                        AND z.cancelado IS NULL
                        AND z.fecha >= x.fecha_inicio_recargo AND z.fecha <= x.fecha_fin_recargo
                        AND z.weekyear = x.weekyear
                        AND z.weekyear = ${semana_weekyear}
                        AND z.credito_id = ${credito_id}
                        ORDER BY z.fecha ASC
                    ) as id_pago_fuera_fecha,
                    a.fecha as fecha_pago
                FROM 
                    dbo.pagos a
                INNER JOIN 
                    dbo.balance_semanal b 
                ON a.credito_id = b.credito_id 
                AND a.fecha BETWEEN  '${fecha}' AND '${fecha2}'
                AND a.fecha >= b.fecha_inicio AND a.fecha <= b.fecha_fin 
                AND a.credito_id = ${credito_id}
                AND a.cancelado IS NULL
                AND a.weekyear = b.weekyear
                AND a.weekyear = ${semana_weekyear}
                GROUP BY b.num_semana, a.id, b.id
                ORDER BY a.credito_id, b.num_semana;`

                //console.log(query);


            let { rows } = await pool.query(query);


            //Hay pagos en fecha valida
            if (rows.length > 0) {

                suma_monto_pagado = rows[0]['suma_monto_pagado'];
                monto_pagado = rows[0]['monto_pagado'];

                if (rows[0]['suma_monto_pagado_valido'] > 0) {

                    console.log('pago en fecha valida');

                    dias_penalizacion = 0;

                    if (rows[0]['suma_monto_pagado_valido'] > monto_semanal) {

                        remanente += (rows[0]['suma_monto_pagado_valido'] - monto_semanal)

                    }

                } else {

                    console.log('aplica penalizacion');


                    if (rows[0]['id_pago_fuera_fecha'] != null) {

                        //Obtenemos info del pago

                        const pago = await Pago.findOne({
                            where: {
                                id: rows[0]['id_pago_fuera_fecha']
                            }
                        });

                        //Remanente de pagos en dias fuera de tiempo
                        if(pago.monto > monto_semanal ){

                            console.log('remanente',remanente);

                            remanente += ( pago.monto - monto_semanal)

                            console.log('remanente',remanente);
                        }

                        console.log('Fecha del pago fuera de tiempo', pago.fecha);
                        console.log('fecha inicio_recargo', fecha_inicio_recargo);

                        let diferencia = Date.parse(pago.fecha) - Date.parse(fecha_inicio_recargo);
                        let diferenciaDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

                        dias_penalizacion = diferenciaDias + 1;

                        console.log('Dias de penalizadcion:', dias_penalizacion);



                    } else {

                    }



                }



            } else {

                if (remanente > monto_semanal) {

                    remanente = remanente - monto_semanal
                    dias_penalizacion = 0;

                    console.log('remanente cuando no hay pago: ', remanente);


                } else {

                    suma_monto_pagado = 0;
                    monto_pagado = 0;
                    dias_penalizacion = 5;

                }



            }

            console.log(rows);

            //Preguntamos si existen bonificaciones para cambiar montos a pagar semanalmente
            //Esto solo si ya es la ultima vuelta
            const descuento = monto_semanal / 2;

            if (num_semana === result[0]['num_semanas'] && (inversion_positiva || cliente_cumplido)) {

                if ((inversion_positiva && !cliente_cumplido) || (cliente_cumplido && !inversion_positiva)) {
                    monto_semanal = monto_semanal / 2;
                }

            }

            //Preguntamos si existen pagos en fechas validas



            //Si no calculamos las penalizaciones



            //Restamos el día de la penalización de mas
            if (dias_penalizacion > 5) {
                dias_penalizacion = 5
            }

            //si ya se termino de pagar el credito guardamos en la base de datos
            //que datos necesitamos credito_id, num_semana, fecha, y los totales
            penalizacion_semanal = (monto_otorgado * dias_penalizacion) / 100;


            //ESte codigo devuelve en 0 las penalizaciones semanales si las penalizaciones de Israel es = 0, descomentar para eliminar penalizaciones semanales
            // if(penalizaciones_auxiliares === 0){
            //     console.log('Segun la base de Israel no hay penalizaciones');
            //     penalizacion_semanal = 0;
            //     dias_penalizacion = 0;
            // }

            adeudo_semanal = (monto_semanal + penalizacion_semanal) - suma_monto_pagado;

            penalizacion_total += penalizacion_semanal;
            pagado_total += Number(suma_monto_pagado);

            //Ultima vuelta, inversion positiva y cliente cumplido
            //TODO: Pendiente hacer esta vuelta solo si la tarifa incluye bonificaciones
            //if (num_semana === result[0]['num_semanas'] && result[0]['bonificaciones'] ) {
            if (num_semana === result[0]['num_semanas']) {


                if (inversion_positiva && cliente_cumplido) {

                    console.log('Descuento 100% inversion positiva, cliente cumplido');
                    adeudo_semanal = 0;

                    dias_penalizacion = 0;
                    penalizacion_semanal = 0;
                    penalizacion_total = 0;
                    adeudo_semanal = 0;
                    monto_pagado = descuento * 2;

                    monto_total = monto_total - descuento;

                    rows = [{
                        weekyear: num_semana,
                        bonificacion: true,
                        concepto: '-100% de dto. inversion positiva y cliente cumplido',
                        monto_pagado: descuento * 2
                    }];


                } else if (inversion_positiva) {

                    console.log('Descuento 50% inversion');
                    console.log('monto semanal', monto_semanal);
                    console.log('adeudo semanal', adeudo_semanal);
                    console.log('monto pagado', suma_monto_pagado);
                    console.log('descuento', descuento);

                    monto_total = monto_total - descuento;
                    //adeudo_semanal = adeudo_semanal - (descuento);
                    //monto_semanal = monto_semanal - (descuento);

                    rows.push({
                        weekyear: num_semana,
                        bonificacion: true,
                        concepto: '-50% dto. inversión positiva',
                        monto_pagado: descuento
                    });
                } else if (cliente_cumplido) {

                    console.log('Descuento 50% cliente cumplido');
                    console.log('monto semanal', monto_semanal);
                    console.log('adeudo semanal', adeudo_semanal);
                    console.log('monto pgado', suma_monto_pagado);
                    console.log('descuento', descuento);

                    monto_total = monto_total - descuento;

                    rows.push({
                        weekyear: num_semana,
                        bonificacion: true,
                        concepto: '-50% dto. cliente cumplido',
                        monto_pagado: descuento
                    });
                }

            }

            semanas.push({
                weekyear: semana_weekyear,
                num_semana: i + 1,
                fecha_inicio: fecha,
                fecha_fin: fecha2,
                fecha_inicio_recargo,
                dias_penalizacion,
                penalizacion_semanal,
                monto_semanal,
                suma_monto_pagado,
                adeudo_semanal,
                pago_cubierto,
                pagos: rows,
                transcurriendo,
                transcurrida,
            });

            num_semana++;
            semana_weekyear++;

        }//Cierre For

        //Que pasa si hay pagos fuera de tiempo? 🤔
        //Preguntamos si hay pagos despues de tiempo
        //Validar que no siempre e ejecute esta consulta

        const consulta_pagos_tardios = await pool.query(`
            SELECT a.id, a.folio, a.fecha as fecha_pago, a.monto as monto_pagado, 
            a.weekyear 
            FROM 
            dbo.pagos a
            INNER JOIN 
            dbo.creditos b
            ON a.credito_id = b.id  
            WHERE a.credito_id = ${credito_id}
            AND a.fecha > b.fecha_fin_prog
            AND a.cancelado IS NULL ORDER BY a.FECHA`);

        if (consulta_pagos_tardios.rows.length > 0) {
            console.log('Existen pagos depués de la fecha');

            //Hay que hacer un push por cada pago a destiempo mediante el for


            for (i = 0; i < consulta_pagos_tardios.rows.length; i++) {

                const nuevaSemana = {
                    pago_tardio: true,
                    weekyear: consulta_pagos_tardios.rows[i]['weekyear'],
                    num_semana: '-',
                    pagos: [
                        {
                            folio: consulta_pagos_tardios.rows[i]['folio'],
                            monto_pagado: consulta_pagos_tardios.rows[i]['monto_pagado'],
                            fecha_pago: consulta_pagos_tardios.rows[i]['fecha_pago']
                        }
                    ],
                    suma_monto_pagado: consulta_pagos_tardios.rows[i]['monto_pagado'],
                    penalizacion_semanal: 0,
                    adeudo_semanal: 0 - consulta_pagos_tardios.rows[i]['monto_pagado'],
                }

                console.log('smpg', nuevaSemana.suma_monto_pagado);

                pagado_total = pagado_total + Number(nuevaSemana.suma_monto_pagado);

                semanas.push(nuevaSemana);


            }


        } else {
            console.log('no existen pagos despues de la fecha');
        }

        console.log('Remanente: ', remanente);

        //Tendriamos que hacer un for hasta n

        grand_total = (penalizacion_total + monto_total) - pagado_total;

        console.log('Monto total:', monto_total);
        console.log('Total pagado:', pagado_total);
        console.log('Total de penalizaciones:', penalizacion_total);
        console.log('Grand Total:', grand_total);
        console.log('Penalizaciones Israel:', penalizaciones_auxiliares);

        return semanas;

    } catch (error) {
        console.log(error);
    }

}


module.exports = {
    generateAmortizacionOptimizada
}

