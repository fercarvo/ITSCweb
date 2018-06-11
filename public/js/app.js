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
            console.log("cambiando a ", evt.target, data)
        }

        loadTemplates($state, "oportunidad", $http, $templateCache)
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

    .controller("oportunidad" ,["$state", function($state){
        $state.go("oportunidad.listar")
    }])
    .controller("oportunidad.listar", ["$scope", "$state", "$compile", "$scope", function($scope, $state, $compile, $scope){

        cargarTabla('oportunidades', '/oportunidad', [{

        }])

        $scope.actividad = function (hola) {
            console.log("actividad.....", hola)
        }


    }])
    .controller("oportunidad.actividad", ["$scope", "$state", "$rootScope", function($scope, $state, $rootScope){

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

function click(data) {
    EventBus.dispatch("newState", 'oportunidad.actividad', leer(data))
}

async function cargarTabla (id, url, onclick) {
    try {
        var data = await fetch(url, {credentials: "same-origin"})

        if (data.ok)
            data = await data.json();
        else
            throw new Error(`Status: ${data.status}, ${data.statusText}`);

        document.getElementById(id).innerHTML = `
            <thead>
                <tr>
                    ${data.fields.reduce((html, val) => {
                        return html + `<th> ${val} </th>`;
                    }, '')}
                    <th >Click me </th>
                </tr>
            </thead>
            <tbody>
                ${data.rows.reduce((html, row) => {
                    return html + `
                        <tr> 
                            ${data.fields.reduce((htmlr, val) => {
                                return htmlr + `
                                <td> ${row[val] || ''} </td>`;        
                            }, '')}
                                <td> <button onclick="click(${escribir(row)})">Hola </button> </td  
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
