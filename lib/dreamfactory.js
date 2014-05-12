(function () {
    var BASE_PATH = "http://localhost/rest";
    var DOCS_PATH = "/api_docs/";
    var APP_NAME = "todoangular";
    window.dreamfactory = window.dreamfactory || {};
    window.dreamfactory.buildAll = function(){
        $.ajax({
            url: BASE_PATH + DOCS_PATH,
            beforeSend: function (request) {
                request.setRequestHeader("X-DREAMFACTORY-APPLICATION-NAME", APP_NAME);
            }
        }).done(function(response){
            response.apis.forEach(function (api) {
                var end = api.path.indexOf("/", 1);
                end = end != -1 ? end : api.path.length;
                var resource = api.path.slice(1, end);
                window.dreamfactory.build(resource);
            });
        });
    };
    window.dreamfactory.build = function (resource) {
        if(Array.isArray(resource)){
            window.dreamfactory.lastResource = resource[resource.length - 1];
            resource.forEach(function(resource){
                window.dreamfactory.build(resource);
            });
            return;
        }
        $.ajax({
            url: BASE_PATH + DOCS_PATH + resource,
            beforeSend: function (request) {
                request.setRequestHeader("X-DREAMFACTORY-APPLICATION-NAME", APP_NAME);
            }
        }).done(function (response) {
            response.apis.forEach(function (api, index) {
                var end = api.path.indexOf("/", 1);
                end = end != -1 ? end : api.path.length;
                var resource = api.path.slice(1, end);
                dreamfactory[resource] = dreamfactory[resource] || {};
                api.operations.forEach(function (method, index) {


                    dreamfactory[resource][method.nickname] = function (data) {
                        var processData = method.method === "GET" ? true :false;
                        //console.log(processData);
                        data = data || {};
                        var pathArray = api.path.split( '/' );
                        var params = Object.keys(data);
                        pathArray.forEach(function(path, index){
                            var pathVar = path.replace(/[{}]/g, "");
                            if(params.indexOf(pathVar) != -1){
                                pathArray.splice(index, 1, data[pathVar]);
                                delete data[pathVar];
                            }
                        });
                        if(method.method === "GET"){
                            var newdata = Object.keys(data).length === 0 ? '' : $.param(data);
                        }else{
                            var newdata = Object.keys(data).length === 0 ? '' : JSON.stringify(data);
                        }

                        var newPath = pathArray.join("/");
                        return $.ajax({
                            url: BASE_PATH + newPath,
                            beforeSend: function (request) {
                                request.setRequestHeader("X-DREAMFACTORY-APPLICATION-NAME", APP_NAME);
                                request.setRequestHeader("X-DREAMFACTORY-SESSION-TOKEN", dreamfactory.SESSION_TOKEN);
                                request.setRequestHeader("Content-Type","application/json");
                                request.setRequestHeader("Accept","application/json");
                            },
                            method: method.method,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            processData : processData,
                            data: newdata,
                            cache: false
                        });
                    };
//
                });
            });

            $(document).trigger("api:" + resource + ":ready", {"name": resource});
        });
    };
    window.dreamfactory.processErrors = function(response){
        var msg = null;
        var errors = JSON.parse(response.responseText).error;
        errors.forEach(function(error){
            msg = error.message;
        });
        msg = msg || "An error occurred, but the server provided no additional information.";
        return msg;
    };

}());
