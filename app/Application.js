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
        updateUser(user);
    };


  //**************************************************************************
  //** updateUser
  //**************************************************************************
    var updateUser = function(user){

      //Update accessLevel for admin user. This is a hack! Also, we need to
      //audit and remove accessLevel throughout the app. Use
        if (user && user.id===-1) user.accessLevel = 5;


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
            if (user && user.accessLevel===5){
                tabs.push({name: "Admin", class: javaxt.media.webapp.AdminPanel});
            }
        }



      //Show/hide tabbar
        var tabContainer = app.el.getElementsByClassName("app-tab-container")[0];
        tabContainer.style.display = tabs.length<2 ? "none" : "block";



      //Update the app
        app.update(user ? user : {}, tabs);



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