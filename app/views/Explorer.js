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


    var me = this;
    var defaultConfig = {

        style: {
            
        }
    };

    var title;
    var button = {};
    var waitmask;
    var thumbnailView;

    var viewport; //for popup windows
    var viewer;

    var filter = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


        if (!config) config = {};
        merge(config, defaultConfig);
        waitmask = config.waitmask;
        viewport = parent;


      //Create main table
        var table = createTable(parent);
        table.className = "javaxt-media-explorer";


      //Create panels
        createHeader(table.addRow().addColumn());
        createBody(table.addRow().addColumn({height: "100%" }));
        createFooter(table.addRow().addColumn());


        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){

    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        thumbnailView.update(filter);
    };


  //**************************************************************************
  //** setViewport
  //**************************************************************************
  /** Used to set the parent for the viewer. This should only be called once.
   */
    this.setViewport = function(el){
        viewport = el;
    };


  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(parent){
        var table = createTable(parent);
        createTitle(table.addRow().addColumn());
        createToolbar(table.addRow().addColumn());
    };


  //**************************************************************************
  //** createTitle
  //**************************************************************************
    var createTitle = function(parent){
        title = createElement("div", parent, "title");
        title.update = function(obj){
            if (!obj) obj = "Home";
            title.innerText = obj;
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
            label: "Back",
            icon: "fas fa-arrow-left"
        });
        button["back"].onClick = function(){

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
                title.update(filter.path[filter.path.length-1]);
                thumbnailView.update(filter);
            }
        };



      //Toggle button used to show/hide inactive users
        var toggle = createElement('div', toolbar, {
            float: "right",
            padding: "3px 5px"
        });

        var table = createTable(toggle);
        var row = table.addRow();
        var label = row.addColumn("toolbar-button-label");
        label.innerText = "Show All"; //Hide folders
        label.style.padding = "0 7px 0 0";


        var cell = row.addColumn();

        var toggleSwitch = new javaxt.dhtml.Switch(cell, {
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


        thumbnailView = new javaxt.media.webapp.ThumbnailView(parent, config);
        thumbnailView.onClick = function(item){

            if (item.isFolder){

              //Navigate to folder
                if (!filter.path) filter.path = [];
                filter.path.push(item.name);
                thumbnailView.update(filter);

              //Update title
                title.update(item.name);

            }
            else{

              //Render media viewer
                if (!viewer) viewer = new javaxt.media.webapp.ItemView(viewport, config);
                viewer.update(item, thumbnailView.getPage(), filter);
                viewer.show();
                var o = getHighestElements(); //thumbnailView.el
                if (!o.contains(viewer.el)){
                    viewer.el.style.zIndex = o.zIndex+1;
                }
            }

        };
    };



  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){

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