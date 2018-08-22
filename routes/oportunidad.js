var express = require('express');
var router = express.Router();
var login = require('./login').router
var { getSecret } = require('./login')
var { requestWS } = require('./webservice')
var { pool, url } = require('../util/DB.js');

router.get('/oportunidad', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var query = `
        select
            op.c_opportunity_id,
            repre.Name as representante,
            cb.Name as cliente,
            to_char(op.foportunidad, 'yyyy/MM/dd') as fechaoportunidad,
            op.description as descripcion,
            op.OpportunityAmt::numeric(10,2)::text as valor,
            ss.Name as etapaventa,
            to_char(op.ExpectedCloseDate, 'yyyy/MM/dd') as fechacierre,            
            op.Comments as comentario
        from c_opportunity op
        join C_BPartner cb on cb.C_BPartner_ID=op.C_BPartner_ID 
        join C_SalesStage ss on ss.C_SalesStage_ID=op.C_SalesStage_ID
        left join C_Campaign c on c.C_Campaign_ID=op.C_Campaign_ID and c.isactive='Y'
        left join AD_User repre on repre.AD_User_ID=op.SalesRep_ID
        left join AD_Org org on org.ad_org_id = op.ad_org_id and org.isactive='Y'
        where ${Number(org)}::numeric in (op.ad_org_id, 0)
            and op.isactive = 'Y'
            and ss.Name != 'Orden'
            and op.foportunidad <= date(now())
            order by op.foportunidad desc, op.SalesRep_ID`;
  
        var data = await pool.query(query);

        res.set('Cache-Control', 'private, max-age=30');
        res.json(parseDBdata(data));
    
    } catch (e) { next(e) }
})

/**
 * Ruta que carga todas las actividades de una oportunidad dada
 */
router.get('/oportunidad/:id/actividades', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var oportunidad = req.params.id || -1;
        var query = `
        select
            ac.C_ContactActivity_ID,
            u.name as usuario,
            tipo.name as tipoactividad,
            to_char(ac.StartDate, 'yyyy/MM/dd') as fechainicio,
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
            and ac.C_Opportunity_ID = (${Number(oportunidad)})::numeric`;

        var data = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=30');
        res.json(parseDBdata(data));
    
    } catch (e) { next(e) }
})

router.get('/oportunidad/:id/solicitudes', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var client = req.session_itsc.ad_client_id;
        var oportunidad = req.params.id || -1;
        var query = `
        select 
            coalesce(tipo_s.name, 'Sin tipo') as tipo_solicitud,
            coalesce(grupo_s.name, 'Sin Grupo') as grupo_solicitud,
            coalesce(categ_s.name, 'Sin Categoria') as categoria_solicitud,
            r.Summary as asunto,
            to_char(r.created, 'yyyy/MM/dd') as fecha_creado,
            to_char(r.updated, 'yyyy/MM/dd') as fecha_actualizacion,
            actualizo.name as usr_actualizo,
            tipo_v.value as tipo_vencimiento,
            state_s.name as estado_solicitud,
            state_s.IsClosed as estado_cerrado,
            solicitante.name as solicitante,
            dest.name as destinatario
        from R_Request r
        left join vw_referencia as tipo_v on tipo_v.key = r.DueType and tipo_v.tipo = 'R_Request Due Type'
        inner join R_RequestType as tipo_s on tipo_s.R_RequestType_ID = r.R_RequestType_ID
        left join R_Group as grupo_s on grupo_s.R_Group_ID = r.R_Group_ID
        left join R_Category as categ_s on categ_s.R_Category_ID = r.R_Category_ID
        left join R_Status as state_s on state_s.R_Status_ID = r.R_Status_ID
        left join AD_User as solicitante on solicitante.AD_User_ID = r.createdby
        left join AD_User as dest on dest.AD_User_ID = r.SalesRep_ID
        left join AD_User as actualizo on actualizo.AD_User_ID = r.updatedby
        where r.record_ID = ${Number(oportunidad)}::integer
            and ${Number(client)}::integer in (r.AD_Client_ID, 0)
            and ${Number(org)}::integer in (r.AD_Org_ID, 0)
            and r.isactive = 'Y'
            and r.ad_table_ID = (select ad_table_id from ad_table tb where tb.tablename = 'C_Opportunity') 
        `;
        var data = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=30');
        res.json(parseDBdata(data));
        
    } catch (e) { next(e) }
})

router.get('/referencia/actividad', login.validarSesion, async (req, res, next) => {
    try {
        var query = `select * from vw_referencia where tipo = 'C_ContactActivity Type'`;
        var { rows } = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=1200');
        res.json(rows);
        
    } catch (e) { 
        console.log(e)
        next(e) 
    }
})

router.post("/gestion/:id/nueva", login.validarSesion, async (req, res, next) => {
    try {
        var actividad = Number(req.params.id);
        var tipo_actividad = req.body.tipo_actividad
        var fecha = req.body.fecha
        var descripcion = req.body.descripcion
        var siguiente_ac = req.body.siguiente_ac
        var f_siguiente_ac = req.body.f_siguiente_ac

        var {user, password} = await getSecret(req.session_itsc.ad_user_id);

        var params = [
            {column: "C_ContactActivity_ID", val: actividad},
            {column: "ContactActivityType", val: tipo_actividad},
            {column: "StartDate", val: fecha},
            {column: "Description", val: descripcion},
            {column: "next_activity", val: siguiente_ac},
            {column: "EndDate", val: f_siguiente_ac}
        ]

        var data = await requestWS(url, "CrearGestion", req.session_itsc, user, password, params)
        res.send(data);

    } catch (e) {
        console.log(e)
        next(new Error(e)) 
    }    
})


function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


module.exports = router;