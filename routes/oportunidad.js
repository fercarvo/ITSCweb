var express = require('express');
var router = express.Router();
var login = require('./login')
var { pool } = require('../util/postgresql.js');

router.get('/oportunidad', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var query = `
        select
            repre.Name as "Representante",
            cb.Name as Cliente,
            --org.name as 'Organizacion 2',
            --op.documentno as no_opor,
            to_char(op.foportunidad, 'dd/MM/yyyy') as "Fecha Oportunidad",
            op.description as "Descripcion",
            --op.C_BPartner_ID as cliente_id,
            --op.SalesRep_ID as repre_id,
            op.OpportunityAmt::numeric(10,2)::text as "Valor",
            ss.Name as "Etapa de Venta",
            --trunc((op.OpportunityAmt*op.Probability/100),2)::text as "Valor Ponderado",
            to_char(op.ExpectedCloseDate, 'dd/MM/yyyy') as "Fecha Cierre",            
            op.Comments as "Comentario"
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