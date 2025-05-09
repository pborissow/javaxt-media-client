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