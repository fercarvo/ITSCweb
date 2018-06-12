angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", function ($stateProvider, $compileProvider) {
        $stateProvider
            .state('oportunidad', {
                templateUrl: '/views/oportunidad/head.html',
                controller: 'oportunidad'
            })
            .state('oportunidad.listar', {
                templateUrl: '/views/oportunidad/listar.html',
                controller: 'oportunidad.listar'
            }) 
            .state('oportunidad.actividad', {
                templateUrl: '/views/oportunidad/actividad.html',
                controller: 'oportunidad.actividad'
            })        
    }])
    .run(["$state", "$http", "$templateCache", "oportunidad", function ($state, $http, $templateCache, op) {
        EventBus.addEventListener("newState", cambiar)

        function cambiar(evt, data) {
            op.data = data
            $state.go('oportunidad.actividad')
        }

        loadTemplates($state, "oportunidad", $http, $templateCache)
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

    .controller("oportunidad" ,["$state", "$scope", function($state, $scope){
        $state.go("oportunidad.listar")
    }])
    .controller("oportunidad.listar", ["$scope", "$state", "$compile", "$scope", function($scope, $state, $compile, $scope){

        cargarTabla('oportunidades', '/oportunidad', [
            {name: 'representante', alias: 'Representante'},
            {name: 'cliente', alias: 'Cliente'},
            {name: 'fechaoportunidad', alias: 'Fecha Oportunidad'},
            {name: 'descripcion', alias: 'Descripcion'},
            {name: 'valor', alias: 'Valor'},
            {name: 'etapaventa', alias: 'Etapa Venta'},
            {name: 'fechacierre', alias: 'Fecha Cierre'},
            {name: 'comentario', alias: 'Comentario'},
            {alias: 'Actividades', cb: data => `<button class="btn" onclick="boton_click(this)" data-itsc="${data}">Mostrar </button>`}
        ])


    }])
    .controller("oportunidad.actividad", ["$scope", "$state", "oportunidad", function($scope, $state, op){
        if (op.data.c_opportunity_id) {
            cargarTabla('actividades', `/oportunidad/${op.data.c_opportunity_id}/actividades`, [
                {name: 'usuario', alias: 'Usuario'},
                {name: 'tipoactividad', alias: 'Tipo Actividad'},
                {name: 'fechainicio', alias: 'Fecha Inicio'},
                {name: 'representantecomercial', alias: 'Rep. Comercial'},
                {name: 'descripcion', alias: 'Descripciòn'}
            ])
        } else {

        }
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
    EventBus.dispatch('newState', 'oportunidad.actividad', data)
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
