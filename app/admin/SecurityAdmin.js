//******************************************************************************
//**  SecurityAdmin
//******************************************************************************
/**
 *   Panel used to configure 3rd party apps (FFmpeg, ImageMagick, etc)
 *
 ******************************************************************************/

javaxt.media.webapp.SecurityAdmin = function(parent, config) {

    var me = this;
    var defaultConfig = {

    };
    var waitmask;
    var rows = {};
    var timer;


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

        var div = createElement("div", parent, "config-table");


        var table = createTable(div);
        table.style.height = "";
        table.className = "javaxt-media-app-admin";



        me.el = div;

      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return "Access Controls";
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
        me.clear();

    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, data){
        if (model==="Setting"){
            if (data.key==="security"){

            }
        }
    };


  //**************************************************************************
  //** updateConfig
  //**************************************************************************
    var updateConfig = function(){

      //Save settings and update the table
        waitmask.show(500);
        save(config.url, payload, {
            success: function(){
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
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var save = javaxt.dhtml.utils.post;
    var get = javaxt.dhtml.utils.get;


    init();
};
