
const pool = require('../database/connection');
const { Op } = require('sequelize');
const BalanceSemanal = require('../models/balance_semanal');
const Pago = require('../models/pago');
const Semana = require('../models/semana');



const generateNewAmortization = async (result = []) => {

    try {

        const credito = result[0];
        const semanasMap = {}; // Objeto para mapear num_semana a la información de la semana

        console.log(credito);

        const balance_semanal = await BalanceSemanal.findAll({
            attributes: ['num_semana', 'monto_semanal', 'fecha_inicio', 'fecha_fin', 'fecha_inicio_valida', 'fecha_fin_valida', 'fecha_inicio_recargo', 'fecha_fin_recargo'],
            where: {
                credito_id: credito.credito_id,
            },
            order: [['num_semana', 'ASC']]
        });

        let remanente = 0;
        let suma_pagado_x = 0;

        for (const semana_balance of balance_semanal) {

            let adeudo_semanal = 0;
            let dias_penalizacion = 0;
            let penalizacion_semanal = 0;
            let suma_pagado = 0;
        
            const semana = await Semana.findOne({
                where: {
                    fecha_inicio: { [Op.gte]: semana_balance.fecha_inicio },
                    fecha_fin: { [Op.lte]: semana_balance.fecha_fin }
                }
            });
        
            //TODO: Queda pendiente calcular el remanente

            console.log('N. semana', semana_balance.num_semana);
            
        
            const pagos = await Pago.findAll({
                where: {
                    credito_id: credito.credito_id,
                    fecha: {
                        [Op.between]: [semana.fecha_inicio, semana.fecha_fin]
                    },
                    weekyear: semana.weekyear,
                    cancelado: null
                }
            });
        
            if (pagos && pagos.length > 0) {

                console.log('hay pagos');

            

                pagos.forEach((pago) => {
                    suma_pagado += Number(pago.monto);
                });
        
                if (suma_pagado > semana_balance.monto_semanal) {
                    remanente += semana_balance.monto_semanal - suma_pagado;
                }
        
                const pagosValidos = pagos.filter((pago) => {


                    if (new Date(pago.fecha) >= semana_balance.fecha_inicio_valida && new Date(pago.fecha) <= semana_balance.fecha_fin_valida) {

                        console.log('hay pagos validos');

                        return true;
                    } else {
                        return false;
                    }
                });
        
                const pagosPenalizados = pagos.filter((pago) => {
                    const fecha_pago = new Date(pago.fecha);
                    fecha_pago.setUTCHours(fecha_pago.getUTCHours() + 6); // Agregar 6 horas a la fecha de pago
                
                    const fecha_inicio_recargo = new Date(semana_balance.fecha_inicio_recargo);
                    const fecha_fin_recargo = new Date(semana_balance.fecha_fin_recargo);
                
                    if (fecha_pago >= fecha_inicio_recargo && fecha_pago <= fecha_fin_recargo) {
                        console.log('Hay pagos no válidos');
                
                        const diffTiempo = Math.abs(fecha_pago - fecha_inicio_recargo);
                        dias_penalizacion = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)) + 1;
                        return true;
                    } else {
                        return false;
                    }
                });
                
            } else {
                const fechaHoy = new Date();
                if (fechaHoy > semana_balance.fecha_fin) {
                    dias_penalizacion = 5;
                } else {
                    dias_penalizacion = 0;
                }
            }

            console.log('Dias penalizacion ', dias_penalizacion);
        
            
        
            penalizacion_semanal = dias_penalizacion * (credito.monto_otorgado * 0.010);
            adeudo_semanal = (Number(semana_balance.monto_semanal) + penalizacion_semanal) - suma_pagado;
            remanente = semana_balance.monto_semanal - suma_pagado;
        
            semanasMap[semana_balance.num_semana] = {
                num_semana: semana_balance.num_semana,
                monto_semanal: semana_balance.monto_semanal,
                weekyear: semana.weekyear,
                fecha_inicio: semana_balance?.fecha_inicio,
                pagos,
                dias_penalizacion,
                penalizacion_semanal,
                adeudo_semanal,
                suma_monto_pagado: suma_pagado,
                remanente: remanente
            };
        }
        

        const fechaFinProg = new Date(credito.fecha_fin_prog);
        fechaFinProg.setDate(fechaFinProg.getDate() + 1);

        console.log(fechaFinProg);

        const pagos_tardios = await Pago.findAll({
            where: {
                credito_id: credito.credito_id,
                fecha: {
                    [Op.gte]: fechaFinProg
                },
            }
        });

        if (pagos_tardios.length > 0) {

            let suma_monto_pagado_tardio = 0;
            let adeudo_semanal_pago_tardio = 0;

            pagos_tardios.forEach(async (pagoTardio) => {

                suma_monto_pagado_tardio += pagoTardio.monto

                adeudo_semanal_pago_tardio = (0 - suma_monto_pagado_tardio);

                const nuevaSemana = {
                    pago_tardio: true,
                    num_semana: '-',
                    monto_semanal: 0,
                    pagos: [
                        {
                            folio: pagoTardio.folio,
                            monto: pagoTardio.monto,
                            fecha: pagoTardio.fecha,
                        }
                    ],
                    suma_monto_pagado: suma_monto_pagado_tardio,
                    penalizacion_semanal: 0,
                    adeudo_semanal: adeudo_semanal_pago_tardio
                }

                semanasMap['-'] = nuevaSemana;
            })
        }else{
            console.log('No hay pagos tardios');
        }

        // Ordenar las semanas por num_semana y devolverlas en un array
        const semanas = Object.values(semanasMap).sort((a, b) => a.num_semana - b.num_semana);

        //console.log('Dias de penalizacion: ', semanas.map(semana => semana.dias_penalizacion));

        console.log(semanas);

        return semanas;
        
    } catch (error) {
        console.log(error);
        throw new Error('Error en la generación de la amortización');
    }
}



module.exports = {
    generateNewAmortization
}

