//******************************************************************************
//**  UserList
//******************************************************************************
/**
 *   Panel used to view and manage users
 *
 ******************************************************************************/

javaxt.media.webapp.UserList = function(parent, config) {

    var me = this;
    var defaultConfig = {
        maxIdleTime: 5*60*1000 //5 minutes
    };
    var grid, userEditor;
    var addButton, editButton, deleteButton;
    var lastRefresh;
    var filter = {};
    var activeUsers = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;


      //Create panel
        var panel = new javaxt.dhtml.Panel(parent, {
            style: config.style.panel
        });
        me.el = panel.el;
        addShowHide(me);

        createToolbar(panel.getToolbar());
        createBody(panel.getBody());
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        if (userEditor) userEditor.hide();
        if (grid) grid.clear();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(_activeUsers){
        activeUsers = _activeUsers;
        grid.update();
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, id, userID){
        var currTime = new Date().getTime();


        grid.forEachRow(function (row) {
            if (row.record.id===userID){
                lastRefresh = currTime;
                row.update(row, row.record);
                return true;
            }
        });
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = parent;

        var createButton = javaxt.media.webapp.utils.createButton;
        var createSpacer = function(){
            javaxt.media.webapp.utils.createSpacer(toolbar);
        };


      //Add button
        addButton = createButton(toolbar, {
            label: "Add",
            icon: "add icon"
        });
        addButton.onClick = function(){
            editUser();
        };


      //Edit button
        editButton = createButton(toolbar, {
            label: "Edit",
            icon: "edit icon",
            disabled: true
        });
        editButton.onClick = function(){
            var records = grid.getSelectedRecords();
            if (records.length>0) editUser(records[0]);
        };



      //Delete button
        deleteButton = createButton(toolbar, {
            label: "Delete",
            icon: "delete icon",
            disabled: true
        });
        deleteButton.onClick = function(){
            var records = grid.getSelectedRecords();
            if (records.length>0) deleteUser(records[0]);
        };


        createSpacer();



      //Refresh button
        var refreshButton = createButton(toolbar, {
            label: "Refresh",
            icon: "refresh icon",
            disabled: false,
            hidden: false
        });
        refreshButton.onClick = function(){
            grid.update();
        };

    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){


        grid = new javaxt.dhtml.DataGrid(parent, {
            style: config.style.table,
            url: "Users",
            filter: filter,
            getResponse: function(url, payload, callback){

                get(url, {
                    payload: payload,
                    success: function(text, xml, url, request){

                        var users = parseResponse(text);
                        var ids = users.map(user => user.personID);
                        get("PersonNames?personID=" + ids.join(","),{
                            success: function(text, xml, url, request){
                                var names = parseResponse(text);
                                users.forEach((user)=>{
                                    var personID = user.personID;
                                    user.names = [];
                                    names.forEach((name)=>{
                                        if (name.personID==personID){
                                            user.names.push(name);
                                            if (name.preferred) user.name = name.name;
                                        }
                                    });
                                    if (!user.name) user.name = user.names[0].name;
                                });
                                request.responseText = JSON.stringify(users);
                                callback.apply(me, [request]);
                            },
                            failure: function(request){
                                callback.apply(me, [request]);
                            }
                        });
                    },
                    failure: function(request){
                        callback.apply(me, [request]);
                    }
                });
            },
            parseResponse: function(request){
                return JSON.parse(request.responseText);
            },
            columns: [
                {header: 'ID', hidden:true},
                {header: 'Name', width:'100%'},
                {header: 'Role', width:'240'},
                {header: 'Enabled', width:'75', align:'center'},
                {header: 'Last Active', width:'175', align:'right'}
            ],
            update: function(row, user){

              //Render name with status icon
                var div = createElement("div");
                div.style.height = "100%";
                var statusIcon = createElement("div", div, "user-status");
                statusIcon.style.float = "left";
                createElement("span", div).innerHTML = user.name;
                row.set('Name', div);



              //Render status
                var status = user.status;
                if (status===1){
                    row.set('Enabled', createElement("i", "check icon"));
                }



              //Render last event
                var lastEvent = activeUsers[user.id+""];
                if (lastEvent){


                    if (!isNaN(lastEvent) || typeof lastEvent === "string"){
                        lastEvent = new Date(lastEvent);
                    }

                    var startTime = lastEvent.getTime();
                    var endTime = startTime+config.maxIdleTime;

                    fadeOut(statusIcon, "#00c34e", "#e3e3e3", startTime, endTime, lastRefresh);


                    var timezone = config.timezone==null ? "America/New York" : config.timezone;
                    timezone = timezone.replace(" ", "_");
                    var str = moment.tz(lastEvent, timezone).format("M/D/YYYY h:mm A");


                    row.set('Last Active', str);
                }
            }
        });


        grid.onSelectionChange = function(){
            var records = grid.getSelectedRecords();
            if (records.length>0){
                editButton.enable();
                deleteButton.enable();
            }
            else{
                editButton.disable();
                deleteButton.disable();
            }
        };


        grid.update = function(){
            lastRefresh = new Date().getTime();
            grid.clear();
            grid.load();
        };

    };


  //**************************************************************************
  //** editUser
  //**************************************************************************
    var editUser = function(user){
        var nopass = "--------------";

      //Instantiate user editor as needed
        if (!userEditor){
            userEditor = new javaxt.media.webapp.UserEditor(document.body, {
                style: config.style
            });
            userEditor.onSubmit = function(){
                var user = userEditor.getValues();
                var password = user.password;
                if (password===nopass) delete user.password;

                saveUser({
                    user: user,
                    success: function(user){
                        userEditor.close();
                        grid.update();
                    },
                    failure: function(request){
                        alert(request);
                    }
                });

            };
        }


      //Clear/reset the form
        userEditor.clear();


      //Updated values
        if (user){
            userEditor.setTitle("Edit User");

            getUser({
                userID: user.id,
                success: function(user){
                    userEditor.update(user);
                    userEditor.setValue("password", nopass);
                    userEditor.show();
                },
                failure: function(request){
                    alert(request);
                }
            });
        }
        else{
            userEditor.setTitle("New User");
            userEditor.setValue("status", true);
            userEditor.setValue("accessLevel", 2);
            userEditor.show();
        }
    };


  //**************************************************************************
  //** getUser
  //**************************************************************************
    var getUser = function(config){
        var userID = config.userID;

        get("User?id="+userID, {
            success: function(text){
                var user = parseResponse(text);


              //Update user with authentication info
                get("UserAuthentications?fields=service,key,value&service=database&userID="+userID, {
                    success: function(text){
                        user.authentication = parseResponse(text);
                        config.success.apply(me, [user]);
                    },
                    failure: config.failure
                });

            },
            failure: config.failure
        });
    };


  //**************************************************************************
  //** saveUser
  //**************************************************************************
    var saveUser = function(config){
        var user = config.user;
        var userAuth = user.authentication;
        delete user['authentication'];

        var dbAuth;
        if (userAuth) userAuth.forEach((auth)=>{
            if (auth.service==='database'){
                dbAuth = auth;
            }
        });

        post("User", user, {
            success: function(userID){
                if (dbAuth){
                    dbAuth.userID = userID;
                    post("UserAuthentication", dbAuth, {
                        success: function(){
                            config.success.apply(me, []);
                        },
                        failure: config.failure
                    });
                }
                else{
                    config.success.apply(me, []);
                }
            },
            failure: config.failure
        });
    };


  //**************************************************************************
  //** deleteUser
  //**************************************************************************
    var deleteUser = function(user){
        del("user?id=" + user.id, {
            success: function(){
                grid.update();
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** fadeOut
  //**************************************************************************
    var fadeOut = function(div, startColor, endColor, startTime, endTime, refreshID){

        if (refreshID!==lastRefresh) return;


        var currTime = new Date().getTime();

        if (currTime >= endTime){
            div.style.backgroundColor = endColor;

            var inactiveUsers = [];
            for (var key in activeUsers) {
                if (activeUsers.hasOwnProperty(key)){
                    var lastUpdate = activeUsers[key];
                    if (lastUpdate===startTime){
                        inactiveUsers.push(key);
                    }
                }
            }

            for (var i in inactiveUsers){
                var userID = inactiveUsers[i];
                delete activeUsers[userID];
            }

            return;
        }

        var ellapsedTime = currTime-startTime;
        var totalRunTime = endTime-startTime;
        var percentComplete = ellapsedTime/totalRunTime;
        //console.log(percentComplete);


        div.style.backgroundColor = chroma.mix(startColor, endColor, percentComplete);


        setTimeout(function(){
            fadeOut(div, startColor, endColor, startTime, endTime, refreshID);
        }, 1000);

    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var del = javaxt.dhtml.utils.delete;
    var post = javaxt.dhtml.utils.post;
    var get = javaxt.dhtml.utils.get;


    var parseResponse = javaxt.media.webapp.utils.parseResponse;

    init();
};