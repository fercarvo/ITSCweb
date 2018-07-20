var request = require('request')

function requestWS(server, process, ctx, username, password, params) {
    var soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:_0="http://idempiere.org/ADInterface/1_0">
   <soapenv:Header/>
   <soapenv:Body>
      <_0:runProcess>
         <_0:ModelRunProcessRequest>
            <_0:ModelRunProcess>
                <_0:serviceType>${process}</_0:serviceType>
                <_0:ParamValues>
                    ${params.reduce((acum, obj) => { return acum + `
                        <_0:field column="${obj.column}">
                            <_0:val>${obj.val}</_0:val>
                        </_0:field>`
                    }, '')}
                </_0:ParamValues>
            </_0:ModelRunProcess>
            <_0:ADLoginRequest>
               <_0:user>${username}</_0:user>
               <_0:pass>${password}</_0:pass>
               <_0:lang>es_EC</_0:lang>
               <_0:ClientID>${ctx.ad_client_id}</_0:ClientID>
               <_0:RoleID>${ctx.ad_role_id}</_0:RoleID>
               <_0:OrgID>${ctx.ad_org_id}</_0:OrgID>
               <_0:WarehouseID>${ctx.ad_warehouse_id}</_0:WarehouseID>
               <_0:stage>0</_0:stage>
            </_0:ADLoginRequest>
         </_0:ModelRunProcessRequest>
      </_0:runProcess>
   </soapenv:Body>
</soapenv:Envelope>`

    return new Promise(resolve => {
        var options = { 
            method: 'POST',
            url: `${server}/ADInterface/services/ModelADService`,
            headers: { 
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/xml; charset=utf-8' 
            },
            body: soap 
        }
    
        request(options, function (error, response, body) {
            if (error) {
                return resolve({
                    data: error.message + ' servidor: ' + server.name, 
                    resolved: false
                })
            } else if (response && (response.statusCode === 200 || response.statusCode === 302) ) {
                return resolve({
                    data: {server: server.name, body},
                    resolved: true
                })
            } else {
                resolve({
                    data:  response.statusCode + ' ' + response.statusMessage + ' ' + server.name, 
                    resolved: false
                })                   
            }                
        })    
    })    
}

module.exports = {
    requestWS
}