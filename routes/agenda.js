var express = require('express');
var router = express.Router();
var login = require('./login').router
var { pool } = require('../util/DB.js');
var moment = require('moment');

router.use((req, res, next) => {
    res.set('Cache-Control', 'private, max-age=15');
    next()
})

/**
 * Obtiene todas las actividades/agendas de un usuario
 */
router.get('/agenda', login.validarSesion, async function (req, res, next) { 
    try {
        var org = req.session_itsc.ad_org_id;
        var dateto = req.query.dateto || moment().format('YYYY-MM-DD')
        var usuario = req.session_itsc.ad_user_id
        var supervisor = req.query.tipo === "equipo" ? true : false;

        var data = await getAgenda(org, dateto, usuario, supervisor)
        res.json(data)

    } catch (e) {
        next(e)
    }
})


router.get('/gestiones', login.validarSesion, async function (req, res, next) { //dos_semanas
    try {
        var org = req.session_itsc.ad_org_id;
        var usuario = req.session_itsc.ad_user_id;

        var datefrom = req.query.datefrom || moment('1990-01-01').format('YYYY-MM-DD')
        var dateto = req.query.dateto || moment().format('YYYY-MM-DD')

        var data = await getGestiones(org, datefrom, dateto, usuario)
        res.json(data)

    } catch (e) {
        next((e))
    }
})


function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


async function getAgenda(org, dateTo, usuario, supervisor = false) {
    var filtro_usuario = (function (){
        if (supervisor)
            return `and ac.createdby in (select AD_User_ID from AD_User where Supervisor_ID = (${usuario})::integer)`
        else
            return `and ac.createdby = (${usuario})::integer`;
    })()

    var filtro_dateto = (function (){
        if (!!dateTo) {
            dateTo = moment(dateTo, "YYYY-MM-DD").format("YYYY-MM-DD")
            return `and date(ac.EndDate) <= date('${dateTo}')`;
        } else {
            return ""
        }
    })()

    var query = `
    select
        ac.C_ContactActivity_ID,
        u.name as usuario,
        (   select v.value from vw_referencia v 
            where v.key = ac.ContactActivityType and v.tipo = 'C_ContactActivity Type' ) as tipoactividad,
        to_char(ac.StartDate, 'yyyy/MM/dd') as fechainicio,
        op.description as oportunidad_descripcion,
        cb.name as cliente,
        repc.name as representantecomercial,
        ac.description as descripcion,
        to_char(ac.EndDate, 'yyyy/MM/dd hh:mm') as siguiente_fecha,
        (   select v.value from vw_referencia v 
            where v.key = ac.next_activity and v.tipo = 'C_ContactActivity Type' ) as siguiente_name,
        (case when ac.IsComplete = 'Y' then 'Realizada'
        else 'No Realizada' end) as estado
    from C_ContactActivity ac
    inner join c_opportunity op on op.c_opportunity_id = ac.c_opportunity_id
    inner join C_BPartner cb on cb.C_BPartner_ID=op.C_BPartner_ID
    left join AD_User u on u.AD_User_ID = ac.AD_User_ID
    left join AD_User repc on repc.AD_User_ID = ac.SalesRep_ID
    where (${Number(org)})::numeric in (ac.ad_org_id, 0)
        ${filtro_usuario}
        and ac.isactive = 'Y'
        and ac.IsComplete = 'N' 
        ${filtro_dateto}`;
    
    var data = await pool.query(query);    
    return parseDBdata(data);
}

async function  getGestiones(org, datefrom, dateto, usuario) {
    org = Number(org);
    datefrom = moment(datefrom, "YYYY-MM-DD").format("YYYY-MM-DD")
    dateto = moment(dateto, "YYYY-MM-DD").format("YYYY-MM-DD")

    var query = `
    select
        ac.C_ContactActivity_ID,
        u.name as usuario,
        tipo.name as tipoactividad,
        to_char(ac.StartDate, 'yyyy/MM/dd') as fechainicio,
        op.description as oportunidad_descripcion,
        cb.name as cliente,
        repc.name as representantecomercial,
        ac.description as descripcion,
        to_char(ac.EndDate, 'yyyy/MM/dd hh:mm') as siguiente_fecha,
        (	select distinct trad.name
            from AD_Reference re 
            join AD_Ref_List rl on rl.AD_Reference_ID = re.AD_Reference_ID
            join AD_Ref_List_Trl trad on trad.AD_Ref_List_ID = rl.AD_Ref_List_ID
            where re.name = 'C_ContactActivity Type' and ac.next_activity = rl.value
            limit 1
        ) as siguiente_name,
        (case when ac.IsComplete = 'Y' then 'Realizada'
        else 'No Realizada' end) as estado
    from C_ContactActivity ac
    inner join c_opportunity op on op.c_opportunity_id = ac.c_opportunity_id
    inner join C_BPartner cb on cb.C_BPartner_ID=op.C_BPartner_ID
    left join (
        select distinct trad.name, rl.value 
        from AD_Reference re 
        join AD_Ref_List rl on rl.AD_Reference_ID = re.AD_Reference_ID
        join AD_Ref_List_Trl trad on trad.AD_Ref_List_ID = rl.AD_Ref_List_ID
        where re.name = 'C_ContactActivity Type'
    ) as tipo on ac.ContactActivityType = tipo.value
    left join AD_User u on u.AD_User_ID = ac.AD_User_ID
    left join AD_User repc on repc.AD_User_ID = ac.SalesRep_ID
    where (${Number(org)})::numeric in (ac.ad_org_id, 0)
        and ac.isactive = 'Y'
        and date(ac.StartDate) between date('${datefrom}') and date('${dateto}')
        and ac.createdby = (${usuario})::integer
    order by fechainicio`;

    var data = await pool.query(query);    
    return parseDBdata(data)
}


module.exports = router;