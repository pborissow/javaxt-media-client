//******************************************************************************
//**  AppAdmin
//******************************************************************************
/**
 *   Panel used to configure 3rd party apps (FFmpeg, ImageMagick, etc)
 *
 ******************************************************************************/

javaxt.media.webapp.AppAdmin = function(parent, config) {

    var me = this;
    var defaultConfig = {
        apps: ["ImageMagick", "FFmpeg"],
        fileService: "dir/"
    };

    var waitmask, fileBrowser;
    var rows = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Parse config
        if (!config.style) config.style = javaxt.dhtml.style.default;
        if (!config.waitmask) config.waitmask = new javaxt.express.WaitMask(document.body);
        waitmask = config.waitmask;

        var div = createElement("div", parent, "javaxt-media-app-admin");
        me.el = div;


      //Create table
        var table = createTable(div);
        table.style.height = "";
        table.className = "config-table";
        config.apps.forEach((app)=>{
            addRow(table, app);
        });


      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return "Applications";
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        for (var key in rows) {
            if (rows.hasOwnProperty(key)){
                var row = rows[key];
                row.path.innerText = "";
                row.button.hide();
            }
        }
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        me.clear();
        waitmask.show(500);
        get("settings?fields=key,value&format=json&key=" +
            config.apps.join(",").toLowerCase(), {
            success: function(text){
                var settings = JSON.parse(text);
                updateRows(settings);
            },
            failure: function(request){
                if (request.status===404){
                    updateRows([]);
                }
                else{
                    alert(request);
                }
            },
            finally: function(){
                waitmask.hide();
            }
        });
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, data){
        if (model==="Setting"){
            var row = rows[data.key];
            if (row) row.path.innerText = data.value;
        }
    };


  //**************************************************************************
  //** updateConfig
  //**************************************************************************
    var updateConfig = function(key, path, callback){

        waitmask.show(500);
        save("setting/" + key, path, {
            success: function(){
                if (callback) callback.apply(me, [key, path]);
                me.update();
            },
            failure: function(request){
                alert(request);
            },
            finally: function(){
                waitmask.hide();
            }
        });
    };


  //**************************************************************************
  //** updateRows
  //**************************************************************************
    var updateRows = function(settings){
        settings.forEach((setting)=>{
            var row = rows[setting.key];
            var value = setting.value;
            if (value==null || typeof value === 'undefined'){
                row.path.innerText = "";
                row.button.hide();
            }
            else{
                row.path.innerText = value;
                row.button.show();
            }
        });
    };


  //**************************************************************************
  //** addRow
  //**************************************************************************
    var addRow = function(table, appName){
        var key = appName.toLowerCase();


      //Create new row
        var tr = table.addRow("config-row noselect");


      //Add icon
        tr.addColumn("app-icon " + key);


      //Add label
        tr.addColumn("label").innerText = appName;


      //Add path
        var path = tr.addColumn("path");
        path.style.width = "100%";


      //Add button
        var button = createElement("div", tr.addColumn(), "button clear");
        addShowHide(button);
        button.hide();
        button.onclick = function(e){
            if (button.isVisible()){
                e.stopPropagation();
                updateConfig(appName, "");
            }
        };


      //Process row click events
        tr.onclick = function(){
            openFileBrowser(appName, path.innerText);
        };


      //Update rows
        rows[key] = {
            path: path,
            button: button
        };
    };


  //**************************************************************************
  //** openFileBrowser
  //**************************************************************************
    var openFileBrowser = function(appName, path, callback){

        if (!fileBrowser){

          //Create file browser
            fileBrowser = createFileBrowser(document.body, config);
            fileBrowser.onClick = function(item, path, row, e){
                var selectButton = fileBrowser.buttons["Select"];
                if (item.type==="Drive" || item.type==="Folder"){
                    fileBrowser.setDirectory(path);
                    selectButton.disabled = true;
                }
                else{
                    selectButton.disabled = false;
                    selectButton.path = path;
                    if (e.detail===2) selectButton.click();
                }
            };
            fileBrowser.onDirectoryChange = function(){
                fileBrowser.buttons["Select"].disabled = true;
            };


          //Add buttons
            var footer = fileBrowser.getFooter();
            var buttonDiv = createElement('div', footer, config.style.window.footerButtonBar); //
            var buttonRow = createTable(buttonDiv).addRow();
            var td = buttonRow.addColumn();
            td.style.width="100%";

            fileBrowser.buttons = {};
            ["Select","Cancel"].forEach((name)=>{
                var input = createElement('input', td, config.style.window.footerButton);
                input.type = "button";
                input.name = name;
                input.value = name;
                fileBrowser.buttons[name] = input;
            });

            var selectButton = fileBrowser.buttons["Select"];
            selectButton.disabled = true;
            selectButton.onclick = function(){
                if (config.user) config.user.preferences.set("fileBrowser.path", this.path);
                updateConfig(fileBrowser.appName, this.path, fileBrowser.close);
            };

            fileBrowser.buttons["Cancel"].onclick = ()=>{
                fileBrowser.close();
            };
        }

        if (!path && config.user){
            path = config.user.preferences.get("fileBrowser.path");
        }

        fileBrowser.appName = appName;
        fileBrowser.setDirectory(path);
        fileBrowser.setTitle(appName);
        fileBrowser.open();
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var save = javaxt.dhtml.utils.post;
    var get = javaxt.dhtml.utils.get;


    var createFileBrowser = javaxt.media.webapp.utils.createFileBrowser;

    init();
};