if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};


//******************************************************************************
//**  Main Application
//******************************************************************************
/**
 *   Primary interface to the media library. This panel can be used within
 *   another application.
 *
 ******************************************************************************/

javaxt.media.webapp.Application = function(parent, config) {

    var me = this;
    var defaultConfig = {

        name: "JavaXT Media Server",


      /** If true, will add an admin tab.
       */
        standAlone: true,


      /** Style for javaxt components.
       */
        style: javaxt.dhtml.style.default,


      /** A shared array of javaxt.dhtml.Window components.
       */
        windows: []

    };


    var app;


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


      //Set app-wide shared config
        if (!javaxt.media.webapp.windows)
            javaxt.media.webapp.windows = config.windows;


      //Create main panel
        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        mainDiv.className = "javaxt-media-server";
        me.el = mainDiv;


      //Instantiate main app (component with horizontal tabs)
        app = new javaxt.express.app.Horizon(mainDiv, {
            name: config.name,
            style: config.style,
            windows: config.windows,
            useBrowserHistory: true
        });

    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(user){
        config.user = user;
        updateUser(user);
    };


  //**************************************************************************
  //** updateUser
  //**************************************************************************
    var updateUser = function(user){
        get("UserAccesses?format=json&fields=componentID,level&userID="+user.id, {
            success: function(text){
                var components = JSON.parse(text);
                var componentIDs = components.map(item => item.componentID);
                get("Components?format=json&fields=id,key&id="+componentIDs, {
                    success: function(text){
                        var arr = JSON.parse(text);
                        var map = {};
                        components.forEach((component)=>{
                            var id = component.componentID;
                            for (var i=0; i<arr.length; i++){
                                if (arr[i].id===id){
                                    map[arr[i].key] = component.level;
                                    break;
                                }
                            }
                        });
                        user.accessLevel = map;
                        updateApp(user);
                    }
                });

            }
        });
    };


  //**************************************************************************
  //** updateUser
  //**************************************************************************
    var updateApp = function(user){


      //Define tabs to render
        var tabs = [];
        tabs.push({
            name: "Home",
            class: javaxt.media.webapp.Explorer,
            config: {
                viewport: me.el,
                style: config.style
            }
        });

        if (config.standAlone===true){
            var addAdmin = false;
            Object.keys(user.accessLevel).forEach((key)=>{
                if (key.indexOf("Admin")>-1) addAdmin = true;
            });
            if (addAdmin){
                tabs.push({name: "Admin", class: javaxt.media.webapp.AdminPanel, config: config});
            }
        }



      //Show/hide tabbar
        var tabContainer = app.el.getElementsByClassName("app-tab-container")[0];
        tabContainer.style.display = tabs.length<2 ? "none" : "block";



      //Update the app
        app.update(user, tabs);



      //Watch for tab change events
        app.beforeTabChange = function(currTab){
            if (currTab.panel.disable) currTab.panel.disable();
        };

        app.onTabChange = function(currTab){

          //Update document title
            if (currTab.panel instanceof javaxt.media.webapp.Explorer){
                var explorer = currTab.panel;
                document.title = explorer.getTitle();
            }
            else{
                var label = currTab.name;
                document.title = config.name + " - " + label;
            }


          //Enable tab
            if (currTab.panel.enable) currTab.panel.enable();

        };

    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var merge = javaxt.dhtml.utils.merge;
    var get = javaxt.dhtml.utils.get;


    init();
};