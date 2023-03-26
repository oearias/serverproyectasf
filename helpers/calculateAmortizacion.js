/*const pool = require('../database/connection');

const generateAmortizacion = async (result = []) => {

    try {

        const credito_id = result['id'];
        const monto_total = Number(result['monto_total']);
        const semanas = [];
        const fecha_inicial = result['fecha_inicio_prog'];
        const monto_semanal = result['monto_total'] / result['num_semanas'];

        //TOTALES
        let penalizacion_total = 0;
        let pagado_total = 0;
        let grand_total = null;

        let fechaToCompare;


        const contratoFinalizado = (credito_id) => {
            return new Promise((resolve, reject) => {
                pool.query(`
                    SELECT grand_total
                    FROM dbo.balance_final a
                    WHERE a.credito_id = ${credito_id}
                  `, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {

                        const { rows } = result;

                        resolve(rows);
                    }
                });
            });
        };

        contratoFinalizado(credito_id)
            .then(res => {

                if (!res[0]) {

                    fechaToCompare = new Date(res[0]['fecha_finalizacion']);
                } else {

                    fechaToCompare = new Date();
                }

                fechaToCompare = new Date(fechaToCompare.getFullYear(), fechaToCompare.getMonth(), fechaToCompare.getDate());


                for (let i = 0; i < 3; i++) {

                    let dias_penalizacion = null;
                    let penalizacion_semanal = null;
                    let suma_monto_pagado = null;
                    let fecha_pago = null;
                    let adeudo_semanal = null;
                    let pago_cubierto = null;
                    let genera_recargo = null;
                    let transcurrida = null;
                    let transcurriendo = null;

                    let fecha = new Date(fecha_inicial);
                    let fechac1 = fecha;
                    fecha.setDate(fecha.getDate() + (i * 7));
                    fecha = fecha.toISOString().slice(0, 10);

                    let fecha2 = new Date(fecha);
                    let fechac2 = fecha2;
                    fecha2.setDate(fecha2.getDate() + (6));
                    fecha2 = fecha2.toISOString().slice(0, 10);

                    let fec1 = new Date(fechac1.getFullYear(), fechac1.getMonth(), fechac1.getDate());
                    let fec2 = new Date(fechac2.getFullYear(), fechac2.getMonth(), fechac2.getDate() + 1);


                    if ((Date.parse(fechaToCompare) >= Date.parse(fec1)) && (Date.parse(fechaToCompare) <= Date.parse(fec2))) {
                        transcurriendo = 1;
                    } else {
                        transcurriendo = 0;
                    }

                    if (Date.parse(fechaToCompare) >= Date.parse(fec2)) {
                        transcurrida = 1;
                    } else {
                        transcurrida = 0;

                    }

                    //Calculamos la fecha en que inician los recargos
                    let fecha_inicio_recargo = new Date(fecha);
                    fecha_inicio_recargo.setDate(fecha_inicio_recargo.getDate() + (2));
                    fecha_inicio_recargo = fecha_inicio_recargo.toISOString().slice(0, 10);

                    const obtenPagos = (credito_id, fecha, fecha2) => {
                        return new Promise((resolve, reject) => {
                            pool.query(`
                                        SELECT a.credito_id,
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
                                            AND z.credito_id = ${credito_id}
                                            ) as suma_monto_pagado,
                                        a.fecha as fecha_pago
                                        FROM dbo.pagos a
                                        INNER JOIN dbo.balance_semanal b 
                                        ON a.credito_id = b.credito_id 
                                        AND a.fecha BETWEEN  '${fecha}' AND '${fecha2}'
                                        AND a.fecha >= b.fecha_inicio AND a.fecha <= b.fecha_fin 
                                        AND a.credito_id = ${credito_id}
                                        AND a.cancelado IS NULL
                                        GROUP BY b.num_semana, a.id, b.id
                                        ORDER BY a.credito_id, b.num_semana;
                                    `, (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    };



                }




            }).then(pago => {

                obtenPagos(credito_id, , ).then(res=>console.log(res)).catch(err=>console.log(err))
                console.log(pago);
            })
            .catch(err => console.log(err))



        //Hacemos el For










        // if (rows.length > 0) {
        //     suma_monto_pagado = rows[0]['suma_monto_pagado'];
        //     monto_pagado = rows[0]['monto_pagado'];
        // } else {
        //     suma_monto_pagado = 0;
        //     monto_pagado = 0;
        // }

        // if (suma_monto_pagado >= monto_semanal) {
        //     pago_cubierto = 1;

        // } else {

        //     pago_cubierto = 0;

        //     if (transcurrida === 1) {
        //         dias_penalizacion = 5
        //     } else {
        //         //
        //         if (transcurriendo === 1) {

        //             //Hoy es dia de penalizacion???
        //             if (Date.parse(fechaToCompare) >= fec1 && Date.parse(fechaToCompare) < Date.parse(fecha_inicio_recargo)) {
        //                 dias_penalizacion = null;
        //             } else {
        //                 let diferencia = Date.parse(fechaToCompare) - Date.parse(fecha_inicio_recargo);
        //                 let diferenciaDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        //                 dias_penalizacion = diferenciaDias + 1;
        //             }


        //         }
        //     }
        // }


        // penalizacion_semanal = (monto_total * dias_penalizacion) / 100;
        // adeudo_semanal = (monto_semanal + penalizacion_semanal) - suma_monto_pagado;

        // penalizacion_total += penalizacion_semanal;
        // pagado_total += Number(suma_monto_pagado);

        // console.log('num semana: ', i + 1)
        // console.log(fecha)
        // console.log(fecha2)
        // console.log(fecha_inicio_recargo)
        // console.log(dias_penalizacion)
        // console.log(penalizacion_semanal)
        // console.log(monto_semanal)
        // console.log(suma_monto_pagado)
        // console.log(adeudo_semanal)
        // console.log(pago_cubierto)
        // console.log(rows)
        // console.log(transcurriendo)
        // console.log(transcurrida)


        // semanas.push({
        //     num_semana: i + 1,
        //     fecha_inicio: fecha,
        //     fecha_fin: fecha2,
        //     fecha_inicio_recargo,
        //     dias_penalizacion,
        //     penalizacion_semanal,
        //     monto_semanal,
        //     suma_monto_pagado,
        //     adeudo_semanal,
        //     pago_cubierto,
        //     pagos: rows,
        //     transcurriendo,
        //     transcurrida
        // });

        //Cierre For

        // grand_total = (penalizacion_total + monto_total) - pagado_total;

        // console.log('Total pagado:', pagado_total);
        // console.log('Total de penalizaciones:', penalizacion_total);
        // console.log('Grand Total:', grand_total);



        // if (grand_total === 0) {
        //     const resp = await pool.query(`
        //     INSERT INTO 
        //     dbo.balance_final
        //                     (credito_id, grand_total, fecha_finalizacion)
        //     VALUES(${credito_id}, ${grand_total}, '${fechaToCompare.toISOString().slice(0, 10)}') RETURNING *
        //             `);
        //     console.log(resp.rows);
        // }



        return semanas;

    } catch (error) {
        console.log(error);
    }

}




module.exports = {
    generateAmortizacion
}

*/



const pool = require('../database/connection');

const generateAmortizacion = async (result = []) => {

    try {

        const credito_id = result['id'];
        const monto_total = Number(result['monto_total']);
        const semanas = [];
        //const fecha_inicial = result['fecha_inicio_prog'];
        const fecha_inicial = result['fecha_inicio_real'];
        const monto_semanal = result['monto_total'] / result['num_semanas'];

        //TOTALES
        let penalizacion_total = 0;
        let pagado_total = 0;
        let grand_total = null;

        let fecha_ultimo_pago = null;

        let fechaHoy = new Date();
        //fechaHoy = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate() + 15 );
        let fechaToCompare;

        //La tabla balance_final en teoría debería tener cuando un usuario ya termino de pagar, hay que buscar el momento idóneo para que 
        //se inserte el registro en esta tabla y ya no se puedan seguir calculando las penalizaciones.
        //Preguntamos si ya termino de pagar, si YA
        //usamos la fecha tope
        //si no usamos la fecha de consulta 
        const { rows } = await pool.query(`
            SELECT grand_total, fecha_finalizacion
            FROM dbo.balance_final a
            WHERE a.credito_id = ${credito_id}
        `);


        if (rows.length) {

            //console.log('Ya terminó el man');

            console.log(rows);

            fecha_ultimo_pago = rows[0]['fecha_finalizacion'];
            //fechaToCompare = new Date(rows[0]['fecha_finalizacion']);
            fechaToCompare = new Date();
        } else {
            console.log('trabalo, el man no ha terminado de pagar!!!');
            fechaToCompare = new Date();
        }

        //El getDate() + 2 permite simular cualquier día sumando o restando dias a la fecha actual 
        fechaToCompare = new Date(fechaToCompare.getFullYear(), fechaToCompare.getMonth(), fechaToCompare.getDate());

        let num_semana = 1;


        ////En este bloque calculamos la semana del año, para eso tomamos la fecha inicial y un dia deespues para que solo delimite una semana del resultado de la query
        let fechaWeekyear = new Date(fecha_inicial);
        let fechaWeekyear2 = fechaWeekyear;
        fechaWeekyear.setDate(fechaWeekyear.getDate());
        fechaWeekyear2.setDate(fechaWeekyear.getDate() +1 )
        fechaWeekyear = fechaWeekyear.toISOString().slice(0, 10);
        fechaWeekyear2 = fechaWeekyear2.toISOString().slice(0, 10);

        console.log(fechaWeekyear);

        const resultado_weekyear = await pool.query(`
        SELECT a.weekyear
        FROM dbo.semanas a
        WHERE '${fechaWeekyear}' >= a.fecha_inicio AND '${fechaWeekyear}' <= a.fecha_fin
        AND '${fechaWeekyear2}' >= a.fecha_inicio AND '${fechaWeekyear2}' <= a.fecha_fin
    `);


        let semana_weekyear = resultado_weekyear.rows[0]['weekyear'];


        //Hacemos el For de la amortizacion
        for (let i = 0; i < result['num_semanas']; i++) {

            console.log('////////////////////////////');
            console.log('num de semana: ', num_semana);

            //Estas variables tienen que reiniciarse cada loop, por eso están aquí.
            let dias_penalizacion = null;
            let penalizacion_semanal = null;
            let suma_monto_pagado = null;
            let fecha_pago = null;
            let adeudo_semanal = null;
            let pago_cubierto = null;
            let genera_recargo = null;
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
            //DESARROLLO. Intentemos sumar un día mas a la fecha_fin de la semana
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
            //console.log(fechaToCompare);
            console.log(fec1);
            console.log(fec2);


            //Calculamos la fecha en que inician los recargos
            let fecha_inicio_recargo = new Date(fecha);
            fecha_inicio_recargo.setDate(fecha_inicio_recargo.getDate() + (2));
            fecha_inicio_recargo = fecha_inicio_recargo.toISOString().slice(0, 10);

            let fecha_fin_recargo = new Date(fecha2);
            fecha_fin_recargo.setDate(fecha_fin_recargo.getDate());
            fecha_fin_recargo = fecha_fin_recargo.toISOString().slice(0, 10);


            // const { rows } = await pool.query(`
            // SELECT a.credito_id,
            //             b.num_semana,
            //             a.folio,
            //             a.monto as monto_pagado,
            //             (SELECT 
            //     SUM(z.monto) as suma_monto_pagado
            //     FROM dbo.pagos z
            //     INNER JOIN 
            //     dbo.balance_semanal x 
            //     ON z.credito_id = x.credito_id 
            //     AND z.cancelado IS NULL
            //     AND z.fecha >= x.fecha_inicio AND z.fecha <= x.fecha_fin
            //     AND z.fecha BETWEEN  '${fecha}' AND '${fecha2}'
            //     AND z.credito_id = ${credito_id}
            //         ) as suma_monto_pagado,
            //             a.fecha as fecha_pago
            // FROM dbo.pagos a
            // INNER JOIN dbo.balance_semanal b 
            // ON a.credito_id = b.credito_id 
            // AND a.fecha BETWEEN  '${fecha}' AND '${fecha2}'
            // AND a.fecha >= b.fecha_inicio AND a.fecha <= b.fecha_fin 
            // AND a.credito_id = ${credito_id}
            // AND a.cancelado IS NULL
            // GROUP BY b.num_semana, a.id, b.id
            // ORDER BY a.credito_id, b.num_semana;
            //         `);

            const { rows } = await pool.query(`
            SELECT a.credito_id,
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
                        a.fecha as fecha_pago
            FROM dbo.pagos a
            INNER JOIN dbo.balance_semanal b 
            ON a.credito_id = b.credito_id 
            AND a.fecha BETWEEN  '${fecha}' AND '${fecha2}'
            AND a.fecha >= b.fecha_inicio AND a.fecha <= b.fecha_fin 
            AND a.credito_id = ${credito_id}
            AND a.cancelado IS NULL
            AND a.weekyear = b.weekyear
            AND a.weekyear = ${semana_weekyear}
            GROUP BY b.num_semana, a.id, b.id
            ORDER BY a.credito_id, b.num_semana;
                    `);


            if (rows.length > 0) {
                suma_monto_pagado = rows[0]['suma_monto_pagado'];
                monto_pagado = rows[0]['monto_pagado'];
                //fecha_pago = rows[0]['fecha'];
            } else {
                suma_monto_pagado = 0;
                monto_pagado = 0;
                //fecha_pago = null;
                //num_semana = null;
            }

            //TODO: ANTES que todo debo preguntar si el total de lo pagado ya superó el monto_total mas recargos, de ser así ya no se seguirán calculando los recargos


            //Preguntamos si se cubrió el pago
            if (suma_monto_pagado >= monto_semanal) {
                pago_cubierto = 1;

                console.log('se cubrio el pago');



                //TODO:
                //Preguntamos si hay pagos fuera de tiempo que generen recargos

                console.log('FECHAS  ///');
                console.log(credito_id);
                console.log(fecha_inicio_recargo);
                console.log(fecha_fin_recargo);
                console.log(fecha);
                console.log(fecha2);

                const { rows } = await pool.query(`
                    SELECT fecha 
                    FROM dbo.pagos a 
                    WHERE a.credito_id = ${credito_id} 
                    AND a.fecha BETWEEN '${fecha_inicio_recargo}' AND  '${fecha_fin_recargo}' 
                    AND a.cancelado IS NULL
                    AND a.weekyear =  ${semana_weekyear}`);


                if (rows.length > 0) {
                    console.log('hay pagos fuera de tiempo');

                    //Antes de calcular los dias de penalizacion necesitamos saber que día se termino de pagar la semana


                    const lista_pagos = await pool.query(`SELECT fecha, monto FROM dbo.pagos a WHERE a.credito_id = ${credito_id} AND a.fecha BETWEEN '${fecha_inicio_recargo}' AND  '${fecha_fin_recargo}' AND a.cancelado IS NULL `);

                    console.log('No de pagos en la semana: ', lista_pagos.rows.length);

                    console.log('Lista de pagos en la semana');
                    console.log(lista_pagos.rows);

                    let monto_pagado_semanal = 0;

                    //Determinamos que la fecha a comparar va a ser el ultimo dia de pago en que se termino de pagar completamente la semana, 
                    //para esto lo ideal es un CICLO FOR e ir comparando cada pago con el adeudo semanal, así hasta obtener el ultimo dia de pago

                    for (let i = 0; i < lista_pagos.rows.length; i++) {

                        //TODO: Falta por comprobar cuando se realizan varios pagos en la semana y se acompleta el pago en día que genere penalizacion
                        //Preguntamos si se cubre el pago
                        monto_pagado_semanal = Number(monto_pagado_semanal) + Number(lista_pagos.rows[i]['monto']);

                        console.log('El monto pagado semanalmente es: ', monto_pagado_semanal);

                        if (monto_pagado_semanal >= monto_semanal) {
                            fechaToCompare = lista_pagos.rows[i]['fecha']
                        }

                    }



                    //Calculamos los días de penalizacion
                    //calculamos cuantos dias de penalizacion
                    let diferencia = Date.parse(fechaToCompare) - Date.parse(fecha_inicio_recargo);
                    let diferenciaDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                    dias_penalizacion = diferenciaDias + 1;

                    console.log('Días de penalización: ', dias_penalizacion);

                    //PENALIZACION RECALCULABLE
                    //Preguntamos si es recalculable la semana
                    if (fecha_ultimo_pago != null && fecha_ultimo_pago < fec2) {
                        dias_penalizacion = 0
                    }
                }


            } else {

                pago_cubierto = 0;

                //Si no se ha cubierto, Preguntamos si es semana transcurrida
                if (transcurrida === 1) {
                    dias_penalizacion = 5

                    //PENALIZACION RECALCULABLE
                    //Preguntamos si es recalculable la semana
                    if (fecha_ultimo_pago != null && fecha_ultimo_pago < fec2) {
                        dias_penalizacion = null
                    }
                } else {
                    //
                    if (transcurriendo === 1) {


                        //Cuando la semana esta transcurriendo
                        console.log('se cumple la condicion madafaca');

                        //Hoy es dia de penalizacion???
                        if (Date.parse(fechaHoy) >= fec1 && Date.parse(fechaHoy) < Date.parse(fecha_inicio_recargo)) {
                            dias_penalizacion = null;
                        } else {
                            //calculamos cuantos dias de penalizacion
                            let diferencia = Date.parse(fechaHoy) - Date.parse(fecha_inicio_recargo);
                            let diferenciaDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                            console.log(fecha_inicio_recargo);
                            console.log(fechaHoy);
                            console.log(diferenciaDias);

                            //Aqui hay que ver por que aveces necesita el mas uno y a veces no
                            dias_penalizacion = diferenciaDias + 1;
                            //dias_penalizacion = diferenciaDias;
                        }

                        //PENALIZACION RECALCULABLE
                        //Preguntamos si es recalculable la semana
                        if (fecha_ultimo_pago != null && fecha_ultimo_pago < fec2) {
                            console.log('aplica el null');
                            dias_penalizacion = null
                        }


                    }
                }
            }

            penalizacion_semanal = (monto_total * dias_penalizacion) / 100;
            adeudo_semanal = (monto_semanal + penalizacion_semanal) - suma_monto_pagado;

            penalizacion_total += penalizacion_semanal;
            pagado_total += Number(suma_monto_pagado);

            //Restamos el día de la penalización de mas
            if(dias_penalizacion > 5){
                console.log('si hay penas');
                dias_penalizacion = 5
            }

            //si ya se termino de pagar el credito guardamos en la base de datos
            //que datos necesitamos credito_id, num_semana, fecha, y los totales



            semanas.push({
                weekyear:semana_weekyear,
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
                transcurrida
            });

            num_semana++;
            semana_weekyear++;

        }//Cierre For

        grand_total = (penalizacion_total + monto_total) - pagado_total;

        console.log('Total pagado:', pagado_total);
        console.log('Total de penalizaciones:', penalizacion_total);
        console.log('Grand Total:', grand_total);

        //Si el vato ya terminó, insertamos en el balance final y esto generaría que se cumpla un true en el if del inicio de este método
        // if (grand_total === 0) {
        //     const resp = await pool.query(`
        //     INSERT INTO
        //             dbo.balance_final
        //                 (credito_id, grand_total, fecha_finalizacion)
        //             VALUES(${credito_id}, ${grand_total}, '${fechaToCompare.toISOString().slice(0, 10)}') RETURNING *
        //                 `);
        //     console.log(resp.rows);
        // }


        return semanas;

    } catch (error) {
        console.log(error);
    }

}




module.exports = {
    generateAmortizacion
}

