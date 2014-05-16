var myApp = myApp || {};
//GET EVERY SERVICE
//dreamfactory.buildAll();
//GET A FEW
dreamfactory.build(['user', 'db', 'system']);
//GET ONE
//dreamfactory.build('user');
//LISTEN FOR THE LAST RESOURCE YOU CALLED:
var progressBar = $("#progress-bar");
var loadingMessage = $("#loading-message");
var errorDiv = $("#error-div");
var tableContainer = $("#data-container");
var tableData = $("#data-table");
var dataMessage = $("#data-message");
var backButton = $("#back-button");
var createForm = $("#form-container");
var dataStatus = $("#data-status");
var currentUser = $("#current-user");
$(document).on("api:system:ready", function () {
    myApp.getSession = function(){
        errorDiv.html("");
        loadingMessage.html("Checking for current session");
        progressBar.show();
        dreamfactory.user.getSession().then(function (response) {
            myApp.listLocalDatabases();
            progressBar.hide();
            var user = response.display_name || response.first_name + " " + response.last_name;
            currentUser.html("Signed in as <b>" + user + "</b>");
        }, function (error) {
            $("#login-form").show();
            progressBar.hide();
            errorDiv.html(dreamfactory.processErrors(error)).show().delay(2000).fadeOut( "slow");
        });
    };
    myApp.getConfig = function(){
        errorDiv.html("");
        loadingMessage.html("Getting Configuration");
        progressBar.show();
        dreamfactory.system.getConfig().then(function(response){
            progressBar.hide();
            //if(!response.allow_guest_user){
            myApp.getSession();
            //}
        }, function(error){
            progressBar.hide();
            errorDiv.html(dreamfactory.processErrors(error)).show().delay(2000).fadeOut( "slow");
        });
    }
    myApp.login = function () {
        errorDiv.html("");
        loadingMessage.html("Logging In");
        progressBar.show();
        var body ={email : $("#email").val(), password : $("#password").val()};
        dreamfactory.user.login(body)
            .then(function (response) {
                //window.dreamfactory.SESSION_TOKEN = response.session_id;
                sessionStorage.setItem("SESSION_TOKEN", response.session_id);
                $("#login-form").hide();
                $("#logout-button").show();
                $("#password").val("");
                progressBar.hide();
                //dreamfactory.db.getRecords({table_name: "todo"});
                myApp.listLocalDatabases();
                var user = response.display_name || response.first_name + " " + response.last_name;
                currentUser.html("Signed in as <b>" + user + "</b>");
            }, function (error) {
                //console.log(error);
                progressBar.hide();
                errorDiv.html(dreamfactory.processErrors(error)).show().delay(2000).fadeOut( "slow");
            });
    };
    myApp.logout = function(){
        dreamfactory.user.logout().then(function(){
            myApp.getSession();
            $("#logout-button").hide();
            tableContainer.hide();
            currentUser.html("");
            sessionStorage.removeItem("SESSION_TOKEN");

        });

    };
    myApp.listLocalDatabases = function(){
        errorDiv.html("");
        backButton.hide();
        dataMessage.html("Let's get some data from your DSP, choose a table below");
        dreamfactory.db.getTables().then(function(response){
            var tables = "";
            var data = response.resource;
            data.forEach(function(table){
                tables += "<tr><td onclick=myApp.showData('" + table.name + "')>" + table.name + "</td></tr>";

            });
            tableData.html(tables);
            tableContainer.show();
            createForm.hide();
        }, function(error){
            errorDiv.html(dreamfactory.processErrors(error).show().delay(2000).fadeOut( "slow"));
        });
    };
    myApp.deleteData = function(event, table_name){
        var row = event.target.parentNode.parentNode;
        var id = row.id;
        dreamfactory.db.deleteRecord({table_name : table_name, id : id}).then(function(response){
            $("#" + response.id).fadeOut();
        });
    };
    myApp.saveData = function(event, table_name){
        var row = event.target.parentNode.parentNode;
        var id = row.id;
        var request = {table_name : table_name , id : id, record: {}};
        for (var i = 0; i < row.childNodes.length - 1; i++) {
            request.record[row.childNodes[i].className] = row.childNodes[i].textContent;
        }
        dreamfactory.db.updateRecord(request).then(function(response){
            dataStatus.addClass("alert-success").html("Record Updated").show().delay(2000).fadeOut( "slow");
        });
    };
    myApp.showData = function(table_name){
        tableData.empty();
        //console.log(event.target.innerHTML);
        dataMessage.html("Viewing Data for " + table_name + " table");
        //GIVE me the data, and the schema behind it in a meta field
        dreamfactory.db.getRecords({table_name:table_name, include_schema:true}).then(function(response){
                var tables = "";
                var data = response.record;
                if(!data[0]){
                    dataMessage.html("No records for " + table_name + " table");
                    backButton.show();
                    return;
                }

                var columns = Object.keys(data[0]);
                //console.log(columns);
                tables = "<tr>";
                columns.forEach(function(column){
                    //console.log(column);
                    tables += "<th>" + column +"</th>";
                });
                tables +="<th></th></tr>";
                data.forEach(function(record){
                    tables += "<tr id='" + record.id +"'>";
                    columns.forEach(function(column){
                        tables += "<td class='"+ column + "' contenteditable='true'>" + record[column] + "</td>";
                    });
                    tables +="<td style='width:100px;'><button onclick=myApp.saveData(event,'" + table_name + "') class='btn'><span class='glyphicon glyphicon-floppy-disk'></span></button><button onclick=myApp.deleteData(event,'" + table_name + "') class='btn'><span class='glyphicon glyphicon-remove'></span></button></td>";
                    tables += "</tr>";
                });
                tableData.html(tables);
                tableContainer.show();
                backButton.show();
                myApp.createForm(response.meta.schema);

            },
            function(error){
                dataStatus.addClass("alert-danger").html(dreamfactory.processErrors(error)).show().delay(2000).fadeOut( "slow");
            }
        );
        myApp.createForm = function(schema){
            var form = "<h5>Create Record for " + schema.label + "</h5><br/><div>";
            var fields = schema.field.filter(function(element){
                return element.type !== "id";
            });
            fields.forEach(function(field){
                form += "<input class='form-item' type='text' placeholder='" + field.name +"' id='" + field.name + "'/></br>";
            });
            form += "<br/><button onclick=myApp.insertData('" + schema.label + "') class='btn btn-primary'>Insert Record</button></div>";
            createForm.html(form).show();
        };
        myApp.insertData = function(table_name){
            var formItems = $(".form-item");
            var record = {};
            formItems.each(function(){
                record[$( this).attr("id")] = $( this ).val();
            });
            dreamfactory.db.createRecords({"table_name":table_name, record: record , fields: "*"})
                .then(function(){
                    myApp.showData(table_name);

                    dataStatus.addClass("alert-success").html("Record Added").show().delay(2000).fadeOut( "slow");
                });
        };



    };
    progressBar.hide();
    myApp.getConfig();
});

