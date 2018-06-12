var express = require('express');
var router = express.Router();
var { pool } = require('../util/postgresql.js');
var cookies = require('cookie-parser');
const crypto = require('crypto');


router.get('/login', function(req, res, next) {
    res.render('login');
});

router.validarSesion = function (req, res, next) {    
    try {
        if (!req.cookies || !req.cookies.session_itsc)
            throw new Error('No existe cookie de sesion');

        req.session_itsc = readToken(req.cookies.session_itsc)
        next()

    } catch (e) {
        if (req.url === '/')
            return res.redirect('/login/')
        
        next(e)
    }
}

router.get('/logout', function (req, res, next) {
    res.clearCookie('session_itsc');
    res.redirect('/login')
})

router.post('/login', async function (req, res, next) {
    console.log(req.body)
    if (!req.body || !req.body.usuario || !req.body.clave)
        return res.status(400).send('Por favor, envie datos correctos');

    try {
        var data = await checkUsuario(req.body.usuario, req.body.clave)

        if (data.length === 0)
            return res.status(400).send('Usuario/Clave Incorrectos');

        return res.json(data)
        
    } catch (e) {
        next(e)
    }    
})

router.post('/login/datos', async function (req, res, next) {
    if (!req.body || !req.body.usuario || !req.body.clave || !req.body.ad_client_id || !req.body.ad_role_id || !req.body.ad_org_id)
        return res.status(400).send('Por favor, envie datos correctos');

    try {
        var data = await createPayload(req.body.usuario, req.body.clave, req.body.ad_client_id, req.body.ad_role_id, req.body.ad_org_id, req.body.m_warehouse_id)
        var token = createToken(data)

        //res.cookie('session_itsc', token,  { maxAge: 1000*60*60*12, httpOnly: true})
        res.send(token)
        
    } catch (e) {
        next(e)
    }    
})

router.get('/login/token/:data', function (req, res, next) {
    try {

        var token = decodeURIComponent(req.params.data)

        readToken(token)
        res.cookie('session_itsc', token,  { maxAge: 1000*60*60*12, httpOnly: true})
        res.redirect(301, '/')  
    } catch (e) {
        console.log("error token", e)
        res.redirect('/login')
    }
})



async function checkUsuario (usuario, clave) {
    var client = await pool.connect()
    var query = `select distinct
        u.AD_User_ID,
        u.name, 
        u.email,
        c.AD_Client_ID,
        c.name as grupo,
        r.ad_role_id,
        r.name as rol,
        org.AD_Org_ID,
        org.name as organizacion,
        w.m_warehouse_id,
        w.name as warehouse
    from vistasapp.vw_login_grupoempresarial c
    inner join ad_user u on u.ad_user_id = c.ad_user_id
    inner join vistasapp.vw_login_rol r on r.ad_client_id = c.ad_client_id
    inner join vistasapp.vw_login_organizacion org on org.ad_role_id = r.ad_role_id
    left join m_warehouse w on w.ad_org_id = org.ad_org_id and w.isactive = 'Y'
    where u.isactive = 'Y' 
        and c.name != 'GardenWorld' 
        and c.user = '${usuario}' and c.password = '${clave}'`;
        
    var { rows } = await client.query(query);
    client.release();
    return rows
}

async function createPayload (usuario, clave, ad_client_id, ad_role_id, ad_org_id, m_warehouse_id) {
    var client = await pool.connect()
    var warehouse = (m_warehouse_id !== null && m_warehouse_id !== "") ? `and w.m_warehouse_id = ${m_warehouse_id}::numeric` : ""
    var query = `select distinct
        u.AD_User_ID,
        u.name, 
        u.email,
        c.AD_Client_ID,
        c.name as grupo,
        r.ad_role_id,
        r.name as rol,
        org.AD_Org_ID,
        org.name as organizacion,
        w.m_warehouse_id,
        w.name as warehouse
    from vistasapp.vw_login_grupoempresarial c
    inner join ad_user u on u.ad_user_id = c.ad_user_id
    inner join vistasapp.vw_login_rol r on r.ad_client_id = c.ad_client_id
    inner join vistasapp.vw_login_organizacion org on org.ad_role_id = r.ad_role_id
    left join m_warehouse w on w.ad_org_id = org.ad_org_id and w.isactive = 'Y'
    where u.isactive = 'Y' 
        and c.name != 'GardenWorld' 
        and c.user = '${usuario}' and c.password = '${clave}'
        and c.ad_client_id = ${ad_client_id}::numeric
        and r.ad_role_id = ${ad_role_id}::numeric
        and org.AD_Org_ID = ${ad_org_id}::numeric
        ${warehouse}`;
    
    var { rows } = await client.query(query);

    if (rows.length === 0)
        throw new Error("Los parametros de entrada no coinciden.");

    var payload = rows[0]
    payload.lang = "es_EC"
    payload.stage = 0
    client.release();
    return payload
}


//Crea token de sesion
function createToken (json) {
    var hmac = crypto.createHmac('SHA256', 'ItSCS3cret0fLif3');
    var payload = JSON.stringify(json)
    var payload_base64 = Buffer.from(payload, 'utf8').toString('base64')

    hmac.update(payload, 'utf8');
    var sign = hmac.digest('base64');

    return `${payload_base64}.${sign}`;
}

//Lee token de sesion, verifica y retorna payload
function readToken (text) {
    var hmac = crypto.createHmac('SHA256', 'ItSCS3cret0fLif3');
    var cookie = text.split('.')

    if (cookie.length !== 2)
        throw new Error('Cookie invalida, no cumple formato');
    
    var payload_base64 = cookie[0]
    var sign = cookie[1]

    var payload =  Buffer.from(payload_base64, 'base64').toString('utf8')
    hmac.update(payload);

    if (hmac.digest('base64') !== sign)
        throw new Error('Firma invalida');

    return JSON.parse(payload)
}

module.exports = router;  