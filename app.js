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
$(document).on("api:system:ready", function () {
    myApp.getSession = function(){
        errorDiv.html("");
        loadingMessage.html("Checking for current session");
        progressBar.show();
        dreamfactory.user.getSession().then(function () {
            myApp.listLocalDatabases();
            progressBar.hide();
        }, function (error) {
            $("#login-form").show();
            progressBar.hide();
            errorDiv.html(dreamfactory.processErrors(error));;
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
            errorDiv.html(dreamfactory.processErrors(error));;
        });
    }
    myApp.login = function () {
        errorDiv.html("");
        loadingMessage.html("Logging In");
        progressBar.show();
        var body ={email : $("#email").val(), password : $("#password").val()};
        dreamfactory.user.login(body)
            .then(function (response) {
                window.dreamfactory.SESSION_TOKEN = response.session_id;
                $("#login-form").hide();
                $("#logout-button").show();
                $("#password").val("");
                progressBar.hide();
                //dreamfactory.db.getRecords({table_name: "todo"});
                myApp.listLocalDatabases();
            }, function (error) {
                //console.log(error);
                progressBar.hide();
                errorDiv.html(dreamfactory.processErrors(error));
            });
    };
    myApp.logout = function(){
        dreamfactory.user.logout().then(function(){
            myApp.getSession();
            $("#logout-button").hide();
            tableContainer.hide();

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
        }, function(error){
            errorDiv.html(dreamfactory.processErrors(error));
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
            //console.log(row.childNodes[i].className + "," +  row.childNodes[i].textContent);
        }
        dreamfactory.db.updateRecord(request).then(function(response){
            console.log("updated record " + response.id);
        });
//      row.childNodes.forEach(function(cell){
//          console.log(cell.innerHTML);
//      });
    };
    myApp.showData = function(table_name){
        tableData.empty();
        //console.log(event.target.innerHTML);
        dataMessage.html("Viewing Data for " + table_name + " table");
        dreamfactory.db.getRecords({table_name:table_name}).then(function(response){
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
                tables +="<td><button onclick=myApp.saveData(event,'" + table_name + "') class='btn btn-primary'>Save</button><button onclick=myApp.deleteData(event,'" + table_name + "') class='btn btn-danger'>Delete</button></td>";
                tables += "</tr>";
            });
            tableData.html(tables);
            tableContainer.show();
            backButton.show();

        });





    }
    progressBar.hide();
    myApp.getConfig();
});

