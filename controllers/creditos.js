const { response } = require('express');
const pool = require('../database/connection');

const puppeteer = require('puppeteer');
const fs = require('fs');
const { handlebars } = require('hbs');

const PDFDocument = require('pdf-lib').PDFDocument

const { queries } = require('../database/queries');
const { buildPatchQuery, buildPostQuery, buildPostQueryReturningId } = require('../database/build-query');
const mensajes = require('../helpers/messages');
const path = require('path');
const { generateAmortizacion } = require('../helpers/calculateAmortizacion');
const { default: Stream } = require('pdf-lib/cjs/core/streams/Stream');

const table = 'dbo.creditos'

const creditoGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getCredito, values);

        res.status(200).json(
            rows[0]
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const creditosGet = async (req, res = response) => {

    try {

        const { rows } = await pool.query(queries.getCreditos);

        const cliente_id = rows[0]?.cliente_id;

        const values = [cliente_id]

        const result = await pool.query(queries.getCliente, values);

        if (result.rows[0]) {
            rows[0].cliente = result.rows[0];
        }

        res.status(200).json(
            rows
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno,
        })
    }
}

const creditoPost = async (req, res = response) => {

    try {

        delete req.body.id;

        //req.body.created_at = new Date().toISOString();

        let consulta = buildPostQueryReturningId(table, req.body);
        let resultado = {};

        const solicitud_id = req.body.solicitud_credito_id;
        const fecha_inicio = req.body.fecha_inicio_prog;

        const { rows } = await pool.query(consulta);

        if (!rows.length) throw new Error('No se pudo insertar el registro.');

        const { id, num_contrato } = rows[0];

        const createWeeksCounter = `CALL pr_create_weeks_counter(${id}, '${fecha_inicio}')`;
        const changeEstatusSolicitud = `CALL pr_change_estatus_solicitud_credito(${solicitud_id})`;

        const procedimientos = [
            createWeeksCounter,
            changeEstatusSolicitud
        ]

        procedimientos.forEach(async (procedimiento) => {
            try {
                await pool.query(procedimiento);
            } catch (error) {
                console.log(error);
            }
        });

        res.status(200).json(
            {
                id,
                msg: `El crédito ${num_contrato} ha sido añadido correctamente.`
            }
        );


    } catch (error) {

        console.log(error);

        const errors = [{
            msg: error.constraint,
            param: error.detail
        }]

        if (errors)

            return res.status(500).json({
                errors
            })

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const creditoPut = async (req, res = response) => {

    try {

        const { id } = req.params;

        delete req.body.id;
        delete req.body.monto_semanal;
        delete req.body.num_contrato;
        delete req.body.adeudo_restante;
        delete req.body.total_pagado;
        delete req.body.total_recargos;
        delete req.body.total_adeudo;

        const consulta = buildPatchQuery(id, table, req.body);

        //BEFORE update Solicitud
        await pool.query(`CALL pr_change_estatus_solicitud_credito_before(${id})`);

        const result = await pool.query(consulta);

        //AFTER update Solicitud
        await pool.query(`CALL pr_change_estatus_solicitud_credito_after(${id})`);

        res.status(200).json(
            `El crédito: ${result.rows[0]['num_contrato']} ha sido modificado correctamente.`
        );


    } catch (error) {

        console.log(error);

        const errors = [{
            msg: error.constraint,
            param: error.detail
        }]

        if (errors)

            return res.status(500).json({
                errors
            })

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const creditoDelete = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id]

        await pool.query(`DELETE FROM dbo.balance_semanal WHERE credito_id = $1`, values)
        const result = await pool.query(queries.deleteCredito, values);

        if (!result.rows.length) throw new Error('No se pudo eliminar el registro.');

        res.status(200).json(
            `El crédito: ${result.rows[0]['num_contrato']} ha sido eliminado correctamente.`
        );

    } catch (error) {

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const setFechaCreditosMasivos = async (req, res = response) => {

    try {

        const creditos = req.body;
        const nullValue = null;

        const creditosExitosos = [];
        const creditosFallidos = [];

        const creditosConFechaEntrega = creditos.filter(credito => credito['fecha_entrega']);

        for (const { credito_id, fecha_entrega, fecha_inicio,
            num_cheque, entregado, no_entregado, motivo, num_semanas } of creditosConFechaEntrega) {

                console.log(num_semanas);


            const fechaInicioAux = fecha_inicio ? `'${fecha_inicio}'` : nullValue;
            const numChequeAux = num_cheque ? Number(num_cheque) : nullValue;
            const entregadoAux = entregado ? entregado : nullValue;
            const noEntregadoAux = no_entregado ? no_entregado : nullValue;
            const motivoAux = motivo ? `'${motivo}'` : nullValue;

            const procedimiento = `CALL pr_set_fecha_entrega_credito_preaprobado( 
                ${credito_id},'${fecha_entrega}',
                ${fechaInicioAux},${numChequeAux},
                ${entregadoAux},${noEntregadoAux},
                ${motivoAux},${num_semanas} 
            )`;


            const resultado = await pool.query(procedimiento);

        }


        res.status(200).json(
            `Crédito(s) modificado(s) con éxito`
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        });
    }
}

const amortizacionGet = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        const { rows } = await pool.query(queries.getAmortizacion, values);

        //necesitamos saber datos generales del credito, tarifa num de semanas, monto semanal y monto total.
        const resultado = await generateAmortizacion(rows);

        res.status(200).json(
            resultado
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const amortizacionPost = async (req, res = response) => {

    try {

        const resultado = await generateAmortizacion(req.body);

        res.status(200).json(
            resultado
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            msg: mensajes.errorInterno
        })
    }
}

const printContrato = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_contrato.hbs', 'utf-8');

        const { rows } = await pool.query(queries.queryPrintContrato, values);

        const DOC = handlebars.compile(template);

        //Aqui pasamos data al template hbs
        const html = DOC(rows[0]);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            margin: {
                top: '1cm',
                bottom: '1cm'
            },
            printBackground: true,
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        const bufferStream = new Stream.PassThrough();

        let namePDF = "contrato_";
        res.setHeader('Content-disposition', "inline; filename*=UTF-8''" + namePDF + ".pdf");
        res.setHeader('Content-type', 'application/pdf');

        bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printAmortizacion = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_amortizacion.hbs', 'utf-8');

        const result = await pool.query(queries.queryPrintAmorti, values);
        const resultado = await pool.query(queries.getCredito, values);

        const DOC = handlebars.compile(template);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, monto_otorgado, monto_otorgado2, monto_semanal, nombre,
            apellido_paterno, apellido_materno, fecha_inicio_prog } = resultado.rows[0];


        result['credito'] = {
            num_contrato, monto_otorgado,
            monto_otorgado2,
            monto_semanal, fecha_inicio_prog,
            nombre, apellido_paterno, apellido_materno
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            margin: {
                top: '1cm',
                bottom: '1cm'
            },
            //landscape: true,
            printBackground: true
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        //const bufferStream = new Stream.PassThrough();

        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printTarjetaPagos = async (req, res = response) => {

    try {

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_pagare.hbs', 'utf-8');

        const result = await pool.query(queries.queryPrintAmorti, values);
        const resultado = await pool.query(queries.getCredito, values);

        handlebars.registerHelper('times', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

        const DOC = handlebars.compile(template);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
            nombre, apellido_paterno, apellido_materno, monto_total_letras,
            telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
            fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2 } = resultado.rows[0];


        console.log(resultado.rows[0]);
        //console.log(result.rows);


        result['credito'] = {
            num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
            monto_semanal, fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
            nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
            zona, agencia
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            margin: {
                top: '1cm',
                bottom: '1cm',
            },
            format: 'letter',
            //landscape: true,
            printBackground: true
        });

        await browser.close();

        const buffer = Buffer.from(pdf);
        //const bufferStream = new Stream.PassThrough();

        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printAllDoc = async (req, res = response) => {

    try {

        console.log('se imprime la documentacion');

        const { id } = req.params;
        const values = [id];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_documentation.hbs', 'utf-8');
        const template2 = fs.readFileSync('./views/template_tarjeta_pagos.hbs', 'utf-8');

        //obtenemos la consult del contrato
        const { rows } = await pool.query(queries.queryPrintContrato, values);

        //Consulta amortización
        const result = await pool.query(queries.queryPrintAmorti, values);
        //Consulta encabezado amortizacion
        const resultado = await pool.query(queries.getCredito, values);

        const DOC = handlebars.compile(template);
        const DOC2 = handlebars.compile(template2);

        if (result.rows) {
            result.rows.forEach(item => {

                if (item['monto_fin_periodo'] == '$.00') {
                    item['monto_fin_periodo'] = '-'
                }

            });
        }

        const { num_contrato, num_cliente, monto_otorgado, monto_otorgado2, monto_total, monto_semanal,
            nombre, apellido_paterno, apellido_materno, monto_total_letras,
            telefono, calle, num_ext, colonia, cp, tipo_asentamiento, zona, agencia, fecha_inicio_prog,
            fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2 } = resultado.rows[0];

        result['contrato'] = {
            rows
        }


        result['credito'] = {
            num_contrato, num_cliente, monto_otorgado, monto_total, monto_otorgado2, monto_total_letras,
            monto_semanal, fecha_inicio_prog, fecha_entrega_prog, fecha_entrega_prog2, fecha_fin_prog2,
            nombre, apellido_paterno, apellido_materno, telefono, calle, num_ext, tipo_asentamiento, colonia, cp,
            zona, agencia
        };

        //Aqui pasamos data al template hbs
        const html = DOC(result);
        const html2 = DOC2(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        //Configuramos las paginas
        const page = await browser.newPage();
        const page2 = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);

        await page.setContent(html);
        await page2.setContent(html2);

        // await page.addStyleTag(
        //     { content: '.page{background-color:red}' },
        // );
        await page.addStyleTag(
            { content: '.page{height:975px}' },
        );
        await page.addStyleTag(
            { content: '@page {size: 8.5in 11in; margin-top: 40px; margin-bottom: 40px}' }
        );
        await page2.addStyleTag(
            { content: '.page{height:975px}' },
        );
        await page2.addStyleTag(
            { content: '@page {size: 8.5in 11in; margin-top: 40px; margin-bottom: 40px}' }
        );


        //TODO: Aqui podemos dejar pendiente el que no se guarde e el disco local los archivos sino en archivos temporales
        await page.pdf({ path: './page1.pdf' });
        await page2.pdf({ path: './page2.pdf' });

        var pdfBuffer1 = fs.readFileSync("./page1.pdf");
        var pdfBuffer2 = fs.readFileSync("./page2.pdf");

        var pdfsToMerge = [pdfBuffer1, pdfBuffer2]

        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfsToMerge) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const buf = await mergedPdf.save();        // Uint8Array

        await browser.close();

        const buffer = Buffer.from(buf);


        let namePDF = "amortizacion_";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);
        //bufferStream.end(buffer);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}

const printEntregasCredito = async (req, res = response) => {


    try {

        const { fecha_entrega_prog } = req.body;

        const values = [fecha_entrega_prog];

        //Iniciamos leyendo la plantilla del contrato
        const template = fs.readFileSync('./views/template_entrega_creditos.hbs', 'utf-8');

        //obtenemos la consult del contrato
        const result = await pool.query(queries.getCreditosPreaprobados, values);
        const resultado = await pool.query(`
            SELECT '${fecha_entrega_prog}' as fecha_entrega_programada, 
            TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','CN'),'999,999D99')) as monto_cn,
            TRIM(TO_CHAR(fu_get_monto_total_cn_r('${fecha_entrega_prog}','R'),'999,999D99')) as monto_r,
            fu_get_count_cn_r('${fecha_entrega_prog}') as count_cn_r,
            fu_get_count_cn('${fecha_entrega_prog}','CN') as count_cn,
            fu_get_count_r('${fecha_entrega_prog}','R') as count_r,
            TRIM(TO_CHAR(fu_get_monto_total_creditos_preaprobados($1),'999,999D99')) as monto_total_creditos`, values);

        //Helpers
        handlebars.registerHelper('ifCond', function(v1, v2, options) {
            if(v1 === v2) {
              return options.fn(this);
            }
            return options.inverse(this);
          });

        const DOC = handlebars.compile(template);

        console.log(result.rows[0]);

        const { 
            fecha_entrega_programada, 
            monto_total_creditos, 
            monto_cn, monto_r, 
            count_cn_r,
            count_cn, count_r
        } = resultado.rows[0];

        result['creditos'] = {
            fecha_entrega_programada,
            monto_total_creditos,
            monto_cn, monto_r,
            count_cn_r,
            count_cn, count_r
        };

        console.log(resultado.rows[0]);

        //Aqui pasamos data al template hbs
        const html = DOC(result);

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        //Configuramos las paginas
        const page = await browser.newPage();

        // Configurar el tiempo de espera de la navegación
        await page.setDefaultNavigationTimeout(0);
        await page.setContent(html);

        const pdf = await page.pdf({
            format: 'letter',
            landscape: true,
            margin: {
                bottom: '1cm',
                left: '1cm',
                right: '1cm'
            },
            printBackground: true
        })
        

        await browser.close();

        const buffer = Buffer.from(pdf);

        let namePDF = "entregaCreditos";
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Content-Description', `File Transfer`);
        res.setHeader('Content-Transfer-Encoding', `binary`);

        res.setHeader('Content-Disposition', `filename="${namePDF}.pdf"`);

        return res.send(buffer);

    } catch (error) {

        console.log(error);

        res.json(error.message);
    }

}


module.exports = {
    creditoGet,
    creditosGet,
    creditoPost,
    creditoPut,
    creditoDelete,
    setFechaCreditosMasivos,
    amortizacionGet,
    amortizacionPost,
    printContrato,
    printAmortizacion,
    printTarjetaPagos,
    printAllDoc,
    printEntregasCredito
} 