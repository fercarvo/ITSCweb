var express = require('express');
var router = express.Router();
var login = require('./login')
var { pool } = require('../util/postgresql.js');

router.get('/oportunidad', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var query = `
        select
            repre.Name as representante,
            cb.Name as cliente,
            --org.name as 'Organizacion 2',
            --op.documentno as no_opor,
            op.foportunidad as fechaoportunidad,
            op.description as descripcion,
            --op.C_BPartner_ID as cliente_id,
            --op.SalesRep_ID as repre_id,
            op.OpportunityAmt::numeric as valor,
            ss.Name as etapaventa,
            --trunc((op.OpportunityAmt*op.Probability/100),2)::text as "Valor Ponderado",
            op.ExpectedCloseDate as fechacierre,            
            op.Comments as comentario
            --c.Name as campana
        from c_opportunity op
        join C_BPartner cb on cb.C_BPartner_ID=op.C_BPartner_ID and cb.isactive='Y'
        join C_SalesStage ss on ss.C_SalesStage_ID=op.C_SalesStage_ID and ss.isactive='Y'
        left join C_Campaign c on c.C_Campaign_ID=op.C_Campaign_ID and c.isactive='Y'
        left join AD_User repre on repre.AD_User_ID=op.SalesRep_ID and repre.isactive='Y'
        left join AD_Org org on org.ad_org_id = op.ad_org_id and org.isactive='Y'
        where ${org}::numeric in (op.ad_org_id, 0)
            and op.isactive = 'Y'
            and ss.Name != 'Orden'
            and op.foportunidad <= date(now())
            order by op.SalesRep_ID`;
  
        var data = await pool.query(query);

        res.json(parseDBdata(data));
    } catch (e) {
        next(e)
    }
})

function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


module.exports = router;