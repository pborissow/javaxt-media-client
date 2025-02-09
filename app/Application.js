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

        /** If true, will add an admin tab */
        standAlone: true,


        style: javaxt.dhtml.style.default
    };


    var app;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


        if (!config) config = {};
        config = merge(config, defaultConfig);


        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        mainDiv.className = "javaxt-media-server";



      //Instantiate main app (component with horizontal tabs)
        app = new javaxt.express.app.Horizon(mainDiv, {
            name: config.name,
            style: config.style,
            useBrowserHistory: true
        });



        var fakeUser = {
            id: 1,
            username: 'admin',
            accessLevel: 5
        };

        fakeUser.preferences = new javaxt.express.UserPreferences(()=>{
            fakeUser.preferences.set("AutoReload", true, true);
            updateUser(fakeUser);
        });




    /*
      //Identify current user and load view
        get("whoami", {
            success: function(username){

                get("user", {
                    success: function(user){
                        updateUser(JSON.parse(user));
                    },
                    failure: function(request){
                        updateUser(null);
                    }
                });


            },
            failure: function(request){
                if (request.status==400){
                    //no problem, user not logged in
                }
                updateUser(null);
            }
        });

    */


        me.el = mainDiv;
    };



  //**************************************************************************
  //** updateUser
  //**************************************************************************
    var updateUser = function(user){


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