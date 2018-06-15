var express = require('express');
var router = express.Router();
var login = require('./login')
var { pool } = require('../util/DB.js');

router.get('/oportunidad', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var query = `
        select
            op.c_opportunity_id,
            repre.Name as representante,
            cb.Name as cliente,
            to_char(op.foportunidad, 'dd/MM/yyyy') as fechaoportunidad,
            op.description as descripcion,
            op.OpportunityAmt::numeric(10,2)::text as valor,
            ss.Name as etapaventa,
            to_char(op.ExpectedCloseDate, 'dd/MM/yyyy') as fechacierre,            
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
            order by op.SalesRep_ID`;
  
        var data = await pool.query(query);

        res.set('Cache-Control', 'private, max-age=30');
        res.json(parseDBdata(data));
    } catch (e) {
        next(e)
    }
})

router.get('/oportunidad/:id/actividades', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var oportunidad = req.params.id || -1;
        var query = `
        select
            u.name as usuario,
            tipo.name as tipoactividad,
            to_char(ac.StartDate, 'dd/MM/yyyy') as fechainicio,
            repc.name as representantecomercial,
            ac.description as descripcion,
            to_char(ac.EndDate, 'dd/MM/yyyy hh:mm') as siguiente_fecha,
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


module.exports = router;