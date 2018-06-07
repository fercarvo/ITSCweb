var express = require('express');
var router = express.Router();
var login = require('./login')
var { pool } = require('../util/postgresql.js');

router.get('/oportunidad', login.validarSesion, async function (req, res, next) {
  try {
    var org = req.session_itsc.ad_org_id;
    var query = `
    select
      --org.name as 'Organizacion 2',
      --op.documentno as no_opor,
      to_char(op.foportunidad, 'dd/MM/yyyy') as "Fecha Oportunidad",
      --op.C_BPartner_ID as cliente_id,
      --op.SalesRep_ID as repre_id,
      repre.Name as "Representante",
      cb.Name as Cliente,
      ss.Name as "Etapa de Venta",
      --op.OpportunityAmt as valor,
      --trunc((op.OpportunityAmt*op.Probability/100),2) as valor_ponderado,
      --to_char(op.ExpectedCloseDate, 'dd/MM/yyyy') as f_cierre,
      --op.Comments as comentario,
      op.description as "Descripcion"
      --c.Name as campana
    from c_opportunity op
    join C_BPartner cb on cb.C_BPartner_ID=op.C_BPartner_ID and cb.isactive='Y'
    join C_SalesStage ss on ss.C_SalesStage_ID=op.C_SalesStage_ID and ss.isactive='Y'
    left join C_Campaign c on c.C_Campaign_ID=op.C_Campaign_ID and c.isactive='Y'
    left join AD_User repre on repre.AD_User_ID=op.SalesRep_ID and repre.isactive='Y'
    left join AD_Org org on org.ad_org_id = op.ad_org_id and org.isactive='Y'
    where ${req.session_itsc.ad_org_id} in (op.ad_org_id, 0)
      and op.isactive = 'Y'
      and ss.Name != 'Orden'
      and op.foportunidad <= date(now())
      order by op.SalesRep_ID`;
  
    var { rows } = await pool.query(query);
    res.json(rows);
  } catch (e) {
    next(e)
  }
})



/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
  res.render('index');
});


function webService (data) {
  var AD_User_ID = null;
  var AD_Org_ID = null;
  var m_warehouse_id = null;
  var user = null;
  var pass = null;
  var url = "sistema.ainteg.ec:8088/ADinterface/services/ModelADService"

   var xml = `
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:_0="http://idempiere.org/ADInterface/1_0">
      <soapenv:Header/>
      <soapenv:Body>
        <_0:runProcess>
          <_0:ModelRunProcessRequest>
            <_0:ModelRunProcess>
              <_0:serviceType>actualizaOrdenProcess</_0:serviceType>
              <_0:ParamValues>
                <_0:field column="data">
                  <_0:val>${data}</_0:val>
                </_0:field>
              </_0:ParamValues>
            </_0:ModelRunProcess>
            <_0:ADLoginRequest>
              <_0:user>SuperUser</_0:user>
              <_0:pass>SuperPROA*</_0:pass>
              <_0:lang>es_EC</_0:lang>
              <_0:ClientID>1000000</_0:ClientID>
              <_0:RoleID>1000000</_0:RoleID>
              <_0:OrgID>${AD_Org_ID}</_0:OrgID>
              <_0:WarehouseID>${m_warehouse_id || 0}</_0:WarehouseID>
              <_0:stage>0</_0:stage>
            </_0:ADLoginRequest>
          </_0:ModelRunProcessRequest>
        </_0:runProcess>
      </soapenv:Body>
    </soapenv:Envelope>`
}

module.exports = router;
