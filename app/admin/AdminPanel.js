//******************************************************************************
//**  AdminPanel
//******************************************************************************
/**
 *   Panel used to render admin components (e.g. UserList)
 *
 ******************************************************************************/

javaxt.media.webapp.AdminPanel = function(parent, config) {


    var me = this;
    var defaultConfig = {

    };
    var waitmask;
    var sidebar, mainPanel, landingPage;
    var panel = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Parse config
        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;
        if (!config.waitmask) config.waitmask = new javaxt.express.WaitMask(document.body);
        waitmask = config.waitmask;


      //Create table
        var table = createTable(parent);
        table.className = "javaxt-media-admin-panel";
        var tr = table.addRow();
        var td;


      //Create side bar
        td = tr.addColumn({
            height: "100%"
        });
        sidebar = createElement("div", td, "sidebar");
        sidebar.style.height = "100%";



      //Create main panel
        mainPanel = tr.addColumn({
            width: "100%",
            height: "100%"
        });



      //Create landing page
        landingPage = createElement("div", mainPanel, "landing-page noselect");
        addShowHide(landingPage);


      //Create panels
        createPanel("Users", "user icon", javaxt.media.webapp.UserAdmin, config);
        createPanel("Config", "config icon", javaxt.media.webapp.ConfigAdmin, config);
        createPanel("Media", "media icon", javaxt.media.webapp.FileAdmin, config);
        createPanel("Files", "folder icon", javaxt.media.webapp.FileAdmin, config);
        createPanel("Database", "database icon", javaxt.express.DBView, {
            waitmask: waitmask,
            style:{
                container: "db-view",
                leftPanel: "left-panel",
                bottomPanel: "bottom-panel",
                table: javaxt.dhtml.style.default.table,
                toolbarButton: javaxt.dhtml.style.default.toolbarButton
            }
        });


        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){

        for (var key in panel) {
            var app = panel[key].app;
            if (app && app.clear) app.clear();
        }

    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){

        var accessLevel = config.user.accessLevel;
        for (var key in panel) {
            var p = panel[key];


            var securityKey;
            if (key=="Users"){
                securityKey = "UserAdmin";
            }
            else if (key=="Media"){
                securityKey = "Media";
            }
            else{
                securityKey = "SysAdmin";
            }


            if (accessLevel[securityKey]==5){
                p.button.show();
            }
            else{
                p.button.hide();
                p.body.hide();
            }

        }
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, id, userID){
        for (var key in panel) {
            var app = panel[key].app;
            if (app && app.notify) app.notify(op, model, id, userID);
        }
    };


  //**************************************************************************
  //** raisePanel
  //**************************************************************************
    this.raisePanel = function(name){
        landingPage.hide();

        for (var key in panel) {
            if (key!==name) panel[key].body.hide();
            panel[key].button.className =
            panel[key].button.className.replace(" selected","").trim();
        }

        var p = panel[name];
        p.body.show();
        if (!p.app){
            var cls = eval(p.className);
            if (cls){
                mainPanel.appendChild(p.body);
                p.app = new cls(p.body, p.config);
                if (p.app.update) p.app.update();
            }
        }
        p.button.className += " selected";
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
    var createPanel = function(name, icon, className, config){
        var button = createElement("div", sidebar, icon + " noselect");
        button.onclick = function(){
            me.raisePanel(name);
        };
        addShowHide(button);
        button.hide();

        var body = createElement("div", {
            height: "100%"
        });
        addShowHide(body);
        body.hide();


        panel[name] = {
           button: button,
           body: body,
           className: className,
           config: config,
           app: null
        };

    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;

    init();
};