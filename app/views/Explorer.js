if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};


//******************************************************************************
//**  Explorer
//******************************************************************************
/**
 *   Used to browse photos and videos, create/edit albums, etc.
 *
 ******************************************************************************/

javaxt.media.webapp.Explorer = function(parent, config) {
    this.className = "javaxt.media.webapp.Explorer"; //used by popstateListener

    var me = this;
    var defaultConfig = {

      /** Parent for the pop-up viewer */
        viewport: parent,

        style: {

        }
    };


  //Components
    var title, toggleSwitch, button = {}; //internal components
    var waitmask, thumbnailView, viewer; //external components

  //Current filter
    var filter = {
        path: []
    };

  //History-related variables
    var ignorePopstate = false;
    var navHistory = [];
    var navPosition = -1;

  //The following variables are used to select features
    var ignoreKeystrokes = false;
    var cntrlIsPressed = false;
    var shiftIsPressed = false;
    var altIsPressed = false;
    var depressedKeys = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (!config) config = {};
        merge(config, defaultConfig);
        waitmask = config.waitmask;


      //Create panel
        var panel = new javaxt.dhtml.Panel(parent, {
            className: "javaxt-media-explorer noselect"
        });
        me.el = panel.el;
        addShowHide(me);


      //Create panels
        createTitle(panel.getHeader());
        createToolbar(panel.getToolbar());
        createBody(panel.getBody());
        createFooter(panel.getFooter());


      //Watch for forward and back events via a 'popstate' listener
        enablePopstateListener();


      //Watch for keystroke events
        enableKeystrokeListener();
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        navHistory = [];
        navPosition = -1;
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        me.clear();

        thumbnailView.update(filter);

        navHistory.push({
            view: "thumbnails",
            filter: me.getFilter(),
            title: document.title
        });
        navPosition = 0;
    };


  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Called whenever this component is brought into view via the main app
   */
    this.enable = function(){
        ignorePopstate = false;
        ignoreKeystrokes = false;


        /* The back button in this component's toolbar calls history.back()
         * in order to go "up" a folder. We do this because we want to allow
         * users to use the forward/back buttons in the browser to navigate
         * through folders. Problem is that if this component is used within
         * another component that uses a popstate listener (e.g. Horizon app),
         * you can run into a situation where a user clicks on the back button
         * and the app does something completly unexpected (e.g. switch tabs
         * in the Horizon app). As a workaround, we're going to push some
         * history into the browser and navigate to the current folder.
         */



      //Count number of pages we need to traverse to get to the root folder
        var stepsBack = 0;
        if (navPosition>0){
            for (var i=navPosition; i>=0; i--){
                if (navHistory[i].filter.path.length===0){
                    break;
                }
                stepsBack++;
            }
        }



        if (stepsBack>0){

          //Disable popstate listener
            ignorePopstate = true;


          //Add new history to the stack going back to the root folder
            for (var i=navPosition-stepsBack; i<navPosition+1; i++){
                addHistory({
                    title: navHistory[i].title,
                    filter: navHistory[i].filter
                });
            }


          //Move browser forward
            history.forward(stepsBack);


          //Remove anything past the current page in the navHistory
            if (navPosition+1<navHistory.length){
                navHistory.splice(navPosition+1);
            }


          //Re-enable the popstate listener
            setTimeout(()=>{ignorePopstate = false;}, 500);
        }
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
  /** Called whenever this component is taken out of view via the main app
   */
    this.disable = function(){
        ignorePopstate = true;
        ignoreKeystrokes = true;

        //TODO: stop slideshow

    };


  //**************************************************************************
  //** getFilter
  //**************************************************************************
    this.getFilter = function(){
        return JSON.parse(JSON.stringify(filter));
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return title.innerText;
    };


  //**************************************************************************
  //** createTitle
  //**************************************************************************
    var createTitle = function(parent){
        title = createElement("div", parent, "title");
        title.update = function(){
            if (!filter.path || filter.path.length===0){
                title.innerText = "Home";
            }
            else{
                title.innerText = filter.path[filter.path.length-1];
            }
            document.title = title.innerText;
        };
        title.clear = function(){
            title.update();
        };
        title.clear();
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = createElement("div", parent, "panel-toolbar");

        var createButton = javaxt.media.webapp.utils.createButton;
        var createSpacer = function(){
            javaxt.media.webapp.utils.createSpacer(toolbar);
        };



      //Back button
        button["back"] = createButton(toolbar, {
            label: "Up",
            icon: "back"
        });
        button["back"].onClick = function(){
            if (!filter.path || filter.path.length===0) return;


          //Get current path
            var orgPath = JSON.parse(JSON.stringify(filter.path));

          //Move back
            moveBack();

          //If we remove the last directory from the orgPath and compare it to
          //the current path, use the browser to go back.
            orgPath.pop();
            if (isEqual(orgPath, filter.path)){
                ignorePopstate = true;
                history.back();
                setTimeout(()=>{ignorePopstate = false;}, 500);
            }
            else{ //not tested...
                //updateHistory();
            }

        };


        button["edit"] = createButton(toolbar, {
            label: "Edit",
            icon: "edit"
        });


      //Toggle button used to show/hide inactive users
        var table = createTable(createElement('div', toolbar, {
            float: "right",
            padding: "3px 5px"
        }));
        var row = table.addRow();
        var label = row.addColumn("toolbar-button-label");
        label.innerText = "Show All"; //Hide folders
        label.style.padding = "0 7px 0 0";


        toggleSwitch = new javaxt.dhtml.Switch(row.addColumn(), {
            style: config.style.switch,
            value: false
        });
        toggleSwitch.onChange = function(value){
            if (value===true){
                filter.recursive = true;
            }
            else{
                delete filter.recursive;
            }
            thumbnailView.update(filter);
        };

    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){


        thumbnailView = new javaxt.media.webapp.ThumbnailView(parent, {
            style: javaxt.dhtml.style.default
        });
        thumbnailView.onClick = function(item){


            if (cntrlIsPressed){
                thumbnailView.select(item);
                return;
            }


            if (item.isFolder){

              //Navigate to folder
                if (!filter.path) filter.path = [];
                filter.path.push(item.name);
                thumbnailView.update(filter);

              //Update history
                addHistory();

              //Update title (do after setting history)
                title.update();

            }
            else{

              //Render media viewer
                if (!viewer) viewer = new javaxt.media.webapp.ItemView(config.viewport, {
                    style: javaxt.dhtml.style.default
                });
                viewer.update(item, thumbnailView.getPage(), filter);
                viewer.show();
                var o = getHighestElements();
                if (!o.contains(viewer.el)){
                    viewer.el.style.zIndex = o.zIndex+1;
                }

              //Update history
                addHistory();
            }

            navHistory.push({
                view: "thumbnails",
                filter: me.getFilter(),
                title: document.title
            });
            navPosition++;

        };
    };


  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){

    };


  //**************************************************************************
  //** moveBack
  //**************************************************************************
  /** Used to move "up" one level. This method is used by the back button and
   *  the popstate listener.
   */
    var moveBack = function(){

        var showAll = toggleSwitch.getValue();
        if (showAll){
            toggleSwitch.setValue(false, true);
            delete filter.recursive;
        }


        if (!filter.path || filter.path.length===0){
            title.clear();
            if (showAll) thumbnailView.update(filter);
        }
        else{
            filter.path.pop();
            title.update();
            thumbnailView.update(filter);
        }


        navPosition--;
        navHistory[navPosition] = {
            view: "thumbnails",
            filter: me.getFilter(),
            title: document.title
        };
    };


  //**************************************************************************
  //** addHistory
  //**************************************************************************
  /** Used to add a "page" to the browser history
   */
    var addHistory = function(params){
        updateState(params, false);
    };


  //**************************************************************************
  //** updateHistory
  //**************************************************************************
  /** Used to update browser history for the current "page"
   */
    var updateHistory = function(params){
        updateState(params, true);
    };


  //**************************************************************************
  //** updateState
  //**************************************************************************
  /** Used to update browser history
   *  @param params JSON object with the following:
   *  <ul>
   *  <li>title - text to display in the browser's title</li>
   *  <li>url - custom url</li>
   *  </ul>
   */
    var updateState = function(params, replace){
        if (!params) params = {};

      //Set title
        var title = params.title;
        if (!title) title = me.getTitle();

      //Set filter
        if (!params.filter) params.filter = JSON.parse(JSON.stringify(filter));

      //Set url
        var url = "";
        if (params.filter.path){
            //url = params.filter.path.join("/"); //don't use until api is updated
        }

      //Get or create state
        var state = window.history.state;
        if (!state) state = {};
        state[me.className] = params;

      //Push or replace state
        if (replace){
            document.title = title;
            history.replaceState(state, title, url);
        }
        else{
            history.pushState(state, title, url);
            document.title = title;
        }
    };


  //**************************************************************************
  //** enablePopstateListener
  //**************************************************************************
    var enablePopstateListener = function(){
        disablePopstateListener();
        window.addEventListener('popstate', popstateListener);


        var state = window.history.state;
        if (!state) state = {};
        if (state[me.className]){
            var params = state[me.className];
            if (params.filter){
                if (params.filter.path){
                    filter.path = params.filter.path;
                    title.update();
                }
            }
        }
        else{

          //Set initial history. This is critical for the popstate listener
            state[me.className] = {
                filter: me.getFilter()
            };
            history.replaceState(state, document.title, '');

        }
    };


  //**************************************************************************
  //** disablePopstateListener
  //**************************************************************************
    var disablePopstateListener = function(){
        window.removeEventListener('popstate', popstateListener);
    };


  //**************************************************************************
  //** popstateListener
  //**************************************************************************
  /** Used to processes forward and back events from the browser
   */
    var popstateListener = function(e) {
        if (ignorePopstate) return;


      //Special case for when the popup viewer is open
        if (viewer){
            if (viewer.isVisible()){
                viewer.hide();

                //TODO: remove/reset current state. Otherwise we're left
                //with an extra page in the forward history.

                return;
            }
        }



        if (e.state[me.className]){ //event emanated from this class

          //TODO: Check if the next "page" should open the viewer.
          //Currently we have an extra page in the forward history.


          //Update thumbnail view and title
            var params = e.state[me.className];
            if (params.filter){
                filter.path = params.filter.path;
                thumbnailView.update(filter);
                title.update();
            }
        }

    };


  //**************************************************************************
  //** enableKeystrokeListener
  //**************************************************************************
    var enableKeystrokeListener = function(){

      //Watch for key events
        document.addEventListener("keydown", function(e){
            depressedKeys[e.keyCode+""] = e.keyCode;
            var numDepressedKeys = Object.keys(depressedKeys).length;

          //Shift key
            if (e.keyCode===16){
                shiftIsPressed = true;
            }

          //Ctrl key
            if (e.keyCode===17){
                cntrlIsPressed = true;
            }

          //Alt key
            if (e.keyCode===18){
                altIsPressed = true;
            }

        });
        document.addEventListener("keyup", function(e){
            delete depressedKeys[e.keyCode+""];
            var numDepressedKeys = Object.keys(depressedKeys).length;


          //Shift key
            if (e.keyCode===16){
                shiftIsPressed = false;
            }

          //Ctrl key
            if (e.keyCode===17){
                cntrlIsPressed = false;
            }

          //Alt key
            if (e.keyCode===18){
                altIsPressed = false;
            }


            if (cntrlIsPressed){

              //Select all (ctrl+a)
                if (e.keyCode===65){
                    thumbnailView.selectAll();
                }
            }
        });

    };


  //**************************************************************************
  //** isEqual
  //**************************************************************************
  /** Returns true if two arrays are equal
   */
    var isEqual = function(a, b){
        if ((!a && b) || (!b && b)) return false;
        return a.every((val, idx) => val === b[idx]);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var createTable = javaxt.dhtml.utils.createTable;
    var merge = javaxt.dhtml.utils.merge;


    init();
};