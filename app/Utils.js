if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};

//******************************************************************************
//**  Utils
//******************************************************************************
/**
 *   Common functions and utilities
 *
 ******************************************************************************/

javaxt.media.webapp.utils = {


  //**************************************************************************
  //** createButton
  //**************************************************************************
  /** Used to create a toolbar button
   */
    createButton: function(toolbar, btn){

        btn = JSON.parse(JSON.stringify(btn));
        btn.style = {
            button: "toolbar-button",
            select: "toolbar-button-selected",
            hover:  "toolbar-button-hover",
            label: "toolbar-button-label"
        };

        if (btn.icon){
            btn.style.icon = "toolbar-button-icon " + btn.icon;
            delete btn.icon;
        }


        if (btn.menu===true){
            btn.style.arrow = "toolbar-button-menu-icon";
            btn.style.menu = "menu-panel";
            btn.style.select = "panel-toolbar-menubutton-selected";
        }

        return new javaxt.dhtml.Button(toolbar, btn);
    },


  //**************************************************************************
  //** createSpacer
  //**************************************************************************
  /** Used to create a toolbar spacer
   */
    createSpacer: function(toolbar){
        javaxt.dhtml.utils.createElement("div", toolbar, "toolbar-spacer");
    },


  //**************************************************************************
  //** createWindow
  //**************************************************************************
    createWindow: function(config){
        var parent = document.body;
        var arr = document.getElementsByClassName("javaxt-media-server");
        if (arr.length>0) parent = arr[0];

        var win = new javaxt.dhtml.Window(parent, config);
        if (!javaxt.media.webapp.windows) javaxt.media.webapp.windows = [];
        javaxt.media.webapp.windows.push(win);
        return win;
    },


  //**************************************************************************
  //** createFileBrowser
  //**************************************************************************
  /** Used to create a file browser
   */
    createFileBrowser: function(parent, config){
        var createElement = javaxt.dhtml.utils.createElement;
        var merge = javaxt.dhtml.utils.merge;

        var defaultConfig = {
            style: {
                toolbar: {
                    panel: "panel-toolbar",
                    button: config.style.toolbarButton,
                    path: "form-input",
                    icons: {
                        back: "back icon",
                        forward: "forward icon",
                        up: "up icon",
                        refresh: "refresh icon"
                    }
                },
                table: config.style.table
            },
            renderers: {
                iconRenderer: function(item){
                    var icon;
                    if (item.type=="Folder" || item.type=="Drive"){
                        icon = item.type.toLowerCase();
                    }
                    else{
                        var arr = item.type.split("/");
                        var type = arr[0];
                        var subtype = arr[1];
                        if (type=="image") icon = "image";
                        else if (type=="video") icon = "video";
                        else icon = "file";
                    }

                    return createElement("i", icon + " icon");
                }
            }
        };


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Update parent as needed
        if (parent===document.body){

          //Create window
            var win = javaxt.media.webapp.utils.createWindow({
                title: config.title,
                width: 600,
                height: 450,
                modal: true,
                closable: true,
                style: config.style.window
            });


          //Update parent
            parent = win.getBody();


          //Update className
            parent.classList.add("javaxt-file-browser");


          //Hide info
            config.style.info = {
                display: "none"
            };

        }


      //Create file browser
        var fileBrowser = new javaxt.express.FileBrowser(parent, config);


      //Copy window methods to the file browser
        if (win){
            for (var m in win) {
                if (typeof win[m] == "function") {
                    if (fileBrowser[m]==null) fileBrowser[m] = win[m];
                }
            }
        }


        return fileBrowser;
    },


  //**************************************************************************
  //** getPixel
  //**************************************************************************
    getPixel: function(){
        var pixel = javaxt.media.webapp.pixel;
        if (!pixel){
            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            pixel = canvas.toDataURL('image/png');
            javaxt.media.webapp.pixel = pixel;
        }
        return pixel;
    },


  //**************************************************************************
  //** parseResponse
  //**************************************************************************
    parseResponse: function(response){
        var s = response.substring(0,1);
        if (s=="{" || s=="["){
            var json = JSON.parse(response);
            if (json.cols && json.rows){ //conflate response

                var rows = json.rows;
                var cols = {};
                for (var i=0; i<json.cols.length; i++){
                    cols[json.cols[i]] = i;
                }
                for (var i=0; i<rows.length; i++){
                    var row = rows[i];
                    var obj = {};
                    for (var col in cols) {
                        if (cols.hasOwnProperty(col)){
                            obj[col] = row[cols[col]];
                        }
                    }
                    rows[i] = obj;
                }

                json = rows;
            }
            response = json;
        }
        return response;
    }

};