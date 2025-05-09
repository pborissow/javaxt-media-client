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

        panel.setHeader({
            title: "Config",
            icon: "fas fa-sliders-h"
        });


        panel.addRow({
            icon: "fas fa-universal-access",
            title: "Access Controls",
            cls: javaxt.media.webapp.SecurityAdmin
        });

        panel.addRow({
            icon: "fas fa-desktop",
            title: "External Applications",
            cls: javaxt.media.webapp.AppAdmin
        });


        panel.addRow({
            icon: "far fa-compass",
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