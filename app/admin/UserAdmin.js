//******************************************************************************
//**  UserAdmin
//******************************************************************************
/**
 *   Panel used to manage users and render usage reports
 *
 ******************************************************************************/

javaxt.media.webapp.UserAdmin = function(parent, config) {

    var me = this;
    var defaultConfig = {
        maxIdleTime: 5*60*1000 //5 minutes
    };
    var userList, userStats;
    var activeUsers = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Parse config
        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;


      //Create main table
        var table = createTable(parent);
        table.className = "javaxt-media-user-admin";


      //Create stats panel
        userStats = new javaxt.express.ActivityMeter(table.addRow().addColumn(), config);

      //Create user list
        userList = new javaxt.media.webapp.UserList(table.addRow().addColumn({
            height: "100%"
        }), config);



        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, id, userID){

        if (model==="WebSocket"){
            if (op==="connect"){
                me.update();
                return;
            }
            else if (op==="disconnect"){
                userStats.clear();
                return;
            }
        }

        if (!userID || userID<0) return;



        if (op==="inactive" && model==="User") delete activeUsers[userID+""];
        else activeUsers[userID+""] = new Date().getTime();


        userStats.notify(op, model, id, userID);
        userList.notify(op, model, id, userID);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        activeUsers = {};
        userList.clear();
        userStats.clear();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        me.clear();

        get("activeUsers", {
            success: function(text){
                activeUsers = parseResponse(text);
                userList.update(activeUsers);
                userStats.update(activeUsers);
            },
            failure: function(){
                userList.update(activeUsers);
                userStats.update(activeUsers);
            }
        });
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var get = javaxt.dhtml.utils.get;

    var parseResponse = javaxt.media.webapp.utils.parseResponse;

    init();
};