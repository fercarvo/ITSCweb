var express = require('express');
var router = express.Router();
var login = require('./login')
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
            order by op.SalesRep_ID`;
  
        var data = await pool.query(query);

        res.set('Cache-Control', 'private, max-age=30');
        res.json(parseDBdata(data));
    
    } catch (e) { next(e) }
})

router.get('/oportunidad/:id/actividades', login.validarSesion, async function (req, res, next) {
    try {
        var org = req.session_itsc.ad_org_id;
        var oportunidad = req.params.id || -1;
        var query = `
        select
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

router.post("/gestion", login.validarSesion, async (req, res, next) => {
    try {
        var oportunidad = req.body.oportunidad
        var f_inicio = req.body.f_inicio
        var comentarios = req.body.comentarios
        var f_fin = req-body.f_fin
        var siguienteac = req.body.siguienteac
        var login = req.session_itsc

        var result = await callWebService(login, oportunidad, f_inicio, comentarios, f_fin, siguienteac)
        

    } catch (e) { next(e) }    
})

function callWebService(login, oportunidad, f_inicio, comentarios, f_fin, siguienteac) {
    var soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:_0="http://idempiere.org/ADInterface/1_0">
   <soapenv:Header/>
   <soapenv:Body>
      <_0:runProcess>
         <_0:ModelRunProcessRequest>
            <_0:ModelRunProcess>
               <_0:serviceType>CrearGestion</_0:serviceType>
               <_0:ParamValues>
                  <_0:field column="C_Opportunity_ID">
                     <_0:val>${oportunidad}</_0:val>
                  </_0:field>

                  <_0:field column="StartDate">
                     <_0:val>${f_inicio}</_0:val>
                  </_0:field>

                  <_0:field column="Comments">
                     <_0:val>${comentarios}</_0:val>
                  </_0:field>

                  <_0:field column="EndDate">
                     <_0:val>${f_fin}</_0:val>
                  </_0:field>

                  <_0:field column="next_activity">
                     <_0:val>${siguienteac}</_0:val>
                  </_0:field>

               </_0:ParamValues>
            </_0:ModelRunProcess>
            <_0:ADLoginRequest>
               <_0:user>${login.username}</_0:user>
               <_0:pass>${login.password}</_0:pass>
               <_0:lang>es_EC</_0:lang>
               <_0:ClientID>${login.ad_client_id}</_0:ClientID>
               <_0:RoleID>${login.ad_role_id}</_0:RoleID>
               <_0:OrgID>${login.ad_org_id}</_0:OrgID>
               <_0:WarehouseID>${login.ad_warehouse_id}</_0:WarehouseID>
               <_0:stage>0</_0:stage>
            </_0:ADLoginRequest>
         </_0:ModelRunProcessRequest>
      </_0:runProcess>
   </soapenv:Body>
</soapenv:Envelope>`

    return new Promise(resolve => {
        var options = { 
            method: 'POST',
            url: `${url}/ADInterface/services/ModelADService`,
            headers: { 
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/xml; charset=utf-8' 
            },
            body: soap 
        }
    
        request(options, function (error, response, body) {
            if (error) {
                return resolve({
                    data: error.message, 
                    resolved: false
                })
            } else if (response && (response.statusCode === 200 || response.statusCode === 302) ) {
                return resolve({
                    data: body,
                    resolved: true
                })
            } else {
                resolve({
                    data:  response.statusCode + ' ' + response.statusMessage, 
                    resolved: false
                })                   
            }                
        })    
    })    
}



function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


module.exports = router;