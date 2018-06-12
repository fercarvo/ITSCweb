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
    .run(["$state", "$http", "$templateCache", function ($state, $http, $templateCache) {
        EventBus.addEventListener("newState", cambiar)

        function cambiar(evt, data) {
            $state.go('oportunidad.actividad')
            //console.log("cambiando a ", evt.target, data)
        }

        loadTemplates($state, "oportunidad", $http, $templateCache)
    }])
    .factory('oportunidad', [function(){
        var oportunidad = {}
        return oportunidad
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

        $scope.goOportunidad = () => $state.go("oportunidad.listar");

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
            {name: 'comentario', alias: 'Comentario'}
        ])


    }])
    .controller("oportunidad.actividad", ["$scope", "$state", "oportunidad", function($scope, $state, oportunidad){

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
                    <th >Actividades </th>
                </tr>
            </thead>
            <tbody>
                ${data.rows.reduce((html, row) => {
                    return html + `
                        <tr> 
                            ${arrColumnas.reduce((htmlr, obj) => {
                                return htmlr + `
                                <td> ${row[obj.name] || ''} </td>`;        
                            }, '')}
                                <td> <button class="btn" onclick="boton_click(this)" data-itsc="${escribir(row)}">Mostrar </button> </td  
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
