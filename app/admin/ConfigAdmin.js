//******************************************************************************
//**  ConfigAdmin
//******************************************************************************
/**
 *   Panel used to manage config settings
 *
 ******************************************************************************/

javaxt.media.webapp.ConfigAdmin = function (parent, config) {

    var me = this;
    var panel;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        panel = new javaxt.media.webapp.AdminSettings(parent, config);
        panel.el.classList.add("javaxt-media-config-admin");


        panel.setHeader({
            title: "Config",
            icon: "config icon"
        });


        panel.addRow({
            icon: "access icon",
            title: "Access Controls",
            cls: javaxt.media.webapp.SecurityAdmin
        });

        panel.addRow({
            icon: "app icon",
            title: "External Applications",
            cls: javaxt.media.webapp.AppAdmin
        });

        panel.addRow({
            icon: "model icon",
            title: "Models",
            cls: javaxt.media.webapp.ModelAdmin
        });

        panel.addRow({
            icon: "email icon",
            title: "Email Server",
            cls: javaxt.media.webapp.EmailAdmin
        });

        panel.addRow({
            icon: "database icon",
            title: "Database Connection",
            cls: javaxt.media.webapp.DatabaseAdmin
        });

        panel.addRow({
            icon: "browser icon",
            title: "Supported Browsers",
            cls: javaxt.media.webapp.BrowserAdmin
        });

        for (var m in panel) {
            if (typeof panel[m] === "function") {
                if (me[m]==null) me[m] = panel[m];
            }
        }

        me.el = panel.el;
        addShowHide(me);
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, data){
        if (model==="Setting"){
            get("settings?fields=key,value&format=json&id="+data,{
                success: function(str){
                    var data = null;
                    var arr = JSON.parse(str);
                    if (arr.length>0) data = arr[0];
                    panel.notify(op, model, data);
                }
            });
        }
        else{
            panel.notify(op, model, data);
        }
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var get = javaxt.dhtml.utils.get;

    init();
};