angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", function ($stateProvider, $compileProvider) {
        $stateProvider
            /*.state('oportunidad', {
                templateUrl: '/views/oportunidad/head.html',
                controller: 'oportunidad'
            })*/
            .state('oportunidad_listar', {
                templateUrl: '/views/oportunidad/listar.html',
                controller: 'oportunidad_listar'
            }) 
            .state('oportunidad_actividad', {
                templateUrl: '/views/oportunidad/actividad.html',
                controller: 'oportunidad_actividad'
            })
            .state('oportunidad_solicitudes', {
                templateUrl: '/views/oportunidad/solicitudes.html',
                controller: 'oportunidad_solicitudes'
            })
            .state('agenda_hoy', { //agenda_dos_semanas
                templateUrl: '/views/agenda/ultimas.html',
                controller: 'agenda_hoy'
            })
            .state('agenda_7dias', { //agenda_dos_semanas gestiones_realizadas
                templateUrl: '/views/agenda/dos_semanas.html',
                controller: 'agenda_7dias'
            })
            .state('gestion_hoy', { //gestion_7dias
                templateUrl: '/views/gestion/hoy.html',
                controller: 'gestion_hoy'
            })
            .state('gestion_7dias', { //gestion_7dias
                templateUrl: '/views/gestion/7dias.html',
                controller: 'gestion_7dias'
            }) //crear_gestion
            .state('crear_gestion', { //crear_gestion
                templateUrl: '/views/gestion/crear_gestion.html',
                controller: 'crear_gestion'
            }) //crear_gestion            
    }])
    .run(["$state", "$http", "$templateCache", "oportunidad", function ($state, $http, $templateCache, op) {
        EventBus.addEventListener("newState", cambiar)

        function cambiar(evt, data) {
            op.data = data;
            $state.go(evt.target);
        }

        loadTemplates($state, "gestion_7dias", $http, $templateCache)
    }])
    .factory('oportunidad', [function(){
        return {
            data: null
        }
    }])
    .directive("loadedDatatable", ['$rootScope', function($rootScope){
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                if (scope.$last) {
                    console.log('termino', attrs.loadedDatatable)
                    $rootScope.$broadcast(attrs.loadedDatatable)
                }
            }
        }
    }])
    /*.controller("oportunidad" ,["$state", "$scope", function($state, $scope){
        console.log("holaaa")
        $state.go("oportunidad.listar")
    }])*/
    .controller("oportunidad_listar", ["$scope", "$state", "$compile", "$scope", function($scope, $state, $compile, $scope){
        console.log("Hola oportunidad")

         cargarTabla('oportunidades', '/oportunidad', [
            {name: 'descripcion', alias: 'Descripcion'},
            {name: 'cliente', alias: 'Cliente'},
            {name: 'representante', alias: 'Asesor'},
            {name: 'fechaoportunidad', alias: 'Fecha Oportunidad'},
            {name: 'valor', alias: 'Valor'},
            {name: 'etapaventa', alias: 'Etapa Venta'},
            {name: 'fechacierre', alias: 'Fecha Cierre'},
            {name: 'comentario', alias: 'Comentario'},
            {alias: 'Actividades', cb: data => `<button class="btn" onclick="boton_click(this)" data-itsc="${data}">Mostrar </button>`},
            {alias: 'Solicitudes', cb: data => `<button class="btn" onclick="cargarSolicitudes('${data}')">Mostrar </button>`}
        ])



    }])
    .controller("oportunidad_actividad", ["$scope", "$state", "oportunidad", function($scope, $state, op){
        if (op.data && op.data.c_opportunity_id) {
            cargarTabla('actividades', `/oportunidad/${op.data.c_opportunity_id}/actividades`, [
                {name: 'tipoactividad', alias: 'Tipo Actividad'},
                {name: 'fechainicio', alias: 'Fecha Inicio'},
                {name: 'descripcion', alias: 'Descripciòn'},              
                {name: 'siguiente_name', alias: 'Tipo Siguiente'},
                {name: 'siguiente_fecha', alias: 'Fecha Siguiente'},
                {name: 'estado', alias: 'Estado'},
                {name: 'usuario', alias: 'Usuario'}  
            ])
        } else {

        }
    }])
    .controller("oportunidad_solicitudes", ["$scope", "$state", "oportunidad", function($scope, $state, op){
        
        cargarTabla('solicitudes', `/oportunidad/${op.data.c_opportunity_id}/solicitudes`, [
            {name: 'tipo_solicitud', alias: 'Tipo'},
            {name: 'asunto', alias: 'Asunto'},
            {name: 'grupo_solicitud', alias: 'Grupo'},
            {name: 'categoria_solicitud', alias: 'Categoria'},
            {name: 'solicitante', alias: 'Solicitante'},
            {name: 'destinatario', alias: 'Destinatario'},
            {name: 'tipo_vencimiento', alias: 'Tipo Vencimiento'},
            {name: 'fecha_creado', alias: 'Creación'},
            {name: 'fecha_actualizacion', alias: 'Actualización'},        
            {name: 'usr_actualizo', alias: 'Usuario Actualización'},
            {name: 'estado_solicitud', alias: 'Estado'},
        ])

    }])
    .controller('gestion_hoy', ["$scope", function($scope){

        var today = moment().format('YYYY-MM-DD')
        
        cargarTabla('gestion_hoy', `/gestiones/?datefrom=${today}&dateto=${today}`, [
            {name: 'fechainicio', alias: 'Fecha'},
            {name: 'tipoactividad', alias: 'Última Gestion'},
            {name: 'descripcion', alias: 'Descripciòn'},
            {name: 'oportunidad_descripcion', alias: 'Oportunidad'},
            {name: 'cliente', alias: 'Prospecto'},
            {name: 'siguiente_fecha', alias: 'Siguiente Gestión'},
            {name: 'siguiente_name', alias: 'Tipo'},                      
            {name: 'usuario', alias: 'Usuario'},
            {alias: 'Crear Siguiente Gestión', cb: data => `<button class="btn" onclick="sgtGestion('${data}')">Crear </button>`}  
        ])

    }])
    .controller('gestion_7dias', ["$scope", function($scope){

        var datefrom = moment().subtract(7, 'days').format('YYYY-MM-DD')
        var dateto = moment().format('YYYY-MM-DD')
        
        cargarTabla('gestion_7dias', `/gestiones/?datefrom=${datefrom}&dateto=${dateto}`, [
            {name: 'fechainicio', alias: 'Fecha'},
            {name: 'tipoactividad', alias: 'Última Gestion'},
            {name: 'descripcion', alias: 'Descripciòn'},
            {name: 'oportunidad_descripcion', alias: 'Oportunidad'},
            {name: 'cliente', alias: 'Prospecto'},
            {name: 'siguiente_fecha', alias: 'Siguiente Gestión'},
            {name: 'siguiente_name', alias: 'Tipo'},                      
            {name: 'usuario', alias: 'Usuario'},
            {alias: 'Crear Siguiente Gestión', cb: data => `<button class="btn" onclick="sgtGestion('${data}')">Crear </button>`}  
        ])

    }])
    .controller('crear_gestion', ["$scope", "oportunidad", function($scope, gestion){

        $scope.gestion_actual = gestion.data.descripcion

        $scope.crearGestion = async function (tipo_actividad, fecha_gestion, gestion, next_activity, next_activity_date) {
            try {                
                var data = {tipo_actividad, fecha_gestion, gestion, next_activity, next_activity_date }
                console.log(data);

                var result = await fetch("/nuevagestion", {
                    credentials: "same-origin",
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })

                if (result.ok)
                    return alert("Gestion creada exitosamente");
                else if (result.status === 401)
                    return location.reload();
                else
                    throw new Error(await result.text() + " " + result.status)   
            } catch (e) {
                console.log(e)
                alert(e.message)
            }     
        }

        console.log(gestion.data);

    }])
    .controller('agenda_hoy', ["$scope", function($scope){
        
        cargarTabla('agenda_hoy', `/agenda/?dateto=${moment().format("YYYY-MM-DD")}`, [
            {name: 'siguiente_fecha', alias: 'Siguiente Gestión'},
            {name: 'siguiente_name', alias: 'Tipo'},                         
            {name: 'oportunidad_descripcion', alias: 'Oportunidad'},
            {name: 'cliente', alias: 'Prospecto'},
            {name: 'tipoactividad', alias: 'Última Gestion'},
            {name: 'fechainicio', alias: 'Fecha'},
            {name: 'descripcion', alias: 'Descripciòn'},
            {name: 'usuario', alias: 'Usuario'}  
        ])

    }])
    .controller('agenda_7dias', ["$scope", function($scope){
        
        cargarTabla('agenda_7dias', `/agenda/?dateto=${moment().add(7, 'days').format("YYYY-MM-DD")}`, [
            {name: 'siguiente_fecha', alias: 'Siguiente Gestión'},
            {name: 'siguiente_name', alias: 'Tipo'}, //descripcion oportunidad, cliente, oportunidad_descripcion                          
            {name: 'oportunidad_descripcion', alias: 'Oportunidad'},
            {name: 'cliente', alias: 'Prospecto'},
            {name: 'tipoactividad', alias: 'Última Gestion'},
            {name: 'fechainicio', alias: 'Fecha'},
            {name: 'descripcion', alias: 'Descripciòn'},
            {name: 'usuario', alias: 'Usuario'}  
        ])

    }])

async function loadTemplates($state, goState, $http, $templateCache) {
    try {
        var promises = []
        var states = $state.get()

        for (i = 1; i < states.length; i++) {
            var p = $http.get(states[i].templateUrl, { cache: $templateCache })
            promises.push(p)
            p.then(function () { }, function (error) { console.log("Error template: ", error) })
        }

        await Promise.all(promises)
                
    } catch (e) {
        console.log("Error templates catch: " + e)
    } finally {
        $state.go(goState) ///////////////////////// State inicial
        document.body.style.pointerEvents = "all"
    }
    
}

function boton_click(element) {
    var data = leer(element.getAttribute('data-itsc'))
    EventBus.dispatch('newState', 'oportunidad_actividad', data)
}

function cargarSolicitudes(data) {
    EventBus.dispatch('newState', 'oportunidad_solicitudes', leer(data));
}

function sgtGestion(data) {
    EventBus.dispatch('newState', 'crear_gestion', leer(data))
}

async function cargarTabla (id, url, arrColumnas) {
    try {
        var data = await fetch(url, {credentials: "same-origin"})

        if (data.ok)
            data = await data.json();
        else
            throw new Error(`Status: ${data.status}, ${data.statusText}`);

        document.getElementById(id).innerHTML = `
            <thead>
                <tr>
                    ${arrColumnas.reduce((html, obj) => {
                        return html + `<th> ${obj.alias} </th>`;
                    }, '')}
                </tr>
            </thead>
            <tbody>
                ${data.rows.reduce((html, row) => {
                    return html + `
                        <tr> 
                            ${arrColumnas.reduce((htmlr, obj) => {
                                return htmlr + `
                                <td> ${obj.name ? (row[obj.name] || '') : obj.cb(escribir(row))} </td>`;        
                            }, '')}
                        </tr>`;
                }, '')}
            </tbody>
        `;
        
        $(`#${id}`).DataTable({ responsive: true })

    } catch (e) {
        console.log(e);
        alert(e.message)
    }
}

function escribir( json ) {
    return window.btoa(unescape(encodeURIComponent( JSON.stringify(json) )));
}

function leer( str ) {
    return JSON.parse( decodeURIComponent(escape(window.atob( str ))) )
}
