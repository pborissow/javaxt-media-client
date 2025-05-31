//******************************************************************************
//**  BrowserAdmin
//******************************************************************************
/**
 *   Panel used to manage supported web browsers
 *
 ******************************************************************************/

javaxt.media.webapp.BrowserAdmin = function(parent, config) {

    var me = this;
    var defaultConfig = {
        url: "setting?key=supported_browsers"
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

        var div = createElement("div", parent, "javaxt-media-browser-admin");
        me.el = div;


        var table = createTable(div);
        table.style.height = "";
        table.className = "config-table";


        ["Chrome", "Edge", "Brave", "Firefox", "Safari", "Opera", "Internet Explorer"]
        .forEach((browser)=>{
            rows[browser] = addRow(table, browser);
        });


      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return "Supported Browsers";
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
        waitmask.show(500);
        get(config.url, {
            success: function(text){
                updateRows(text.length>0 ? text.split(",") : []);
            },
            failure: function(request){
                if (request.status===404){
                    updateRows([]);
                }
                else{
                    alert(request);
                }
            },
            finally: function(){
                waitmask.hide();
            }
        });
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, data){
        if (model==="Setting"){
            if (data.key==="supported_browsers"){
                var browsers = data.value;
                if (!browsers || browsers.length==0) browsers = [];
                else browsers = browsers.split(",");
                updateRows(browsers);
            }
        }
    };


  //**************************************************************************
  //** updateRows
  //**************************************************************************
    var updateRows = function(browsers){
        if (browsers.length===0){
            for (var browser in rows) {
                if (rows.hasOwnProperty(browser)){
                    var row = rows[browser];
                    var toggleSwitch = row.toggleSwitch;
                    toggleSwitch.setValue(true, true);
                }
            }
        }
        else{
            for (var browser in rows) {
                if (rows.hasOwnProperty(browser)){
                    var row = rows[browser];
                    var toggleSwitch = row.toggleSwitch;
                    toggleSwitch.setValue(false, true);
                }
            }

            browsers.forEach((browser)=>{
                if (rows[browser]) rows[browser].toggleSwitch.setValue(true, true);
            });
        }
    };


  //**************************************************************************
  //** updateConfig
  //**************************************************************************
    var updateConfig = function(){

      //Generate list of browsers
        var browsers = [];
        var numRows = 0;
        for (var browser in rows) {
            if (rows.hasOwnProperty(browser)){
                var row = rows[browser];
                var toggleSwitch = row.toggleSwitch;
                if (toggleSwitch.getValue()){
                    browsers.push(browser);
                }
                numRows++;
            }
        }


      //Create payload to save settings
        var payload;
        if (browsers.length===numRows) payload = "";
        else payload = browsers.join(",");


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
  //** addRow
  //**************************************************************************
    var addRow = function(table, browser){

        var tr = table.addRow("config-row noselect");


      //Add browser icon
        var td = tr.addColumn({
            padding: "0 5px"
        });
        var img = createElement("img", td,
        "browser-icon " + (browser.toLowerCase().replace(" ", "-")));
        img.src = getPixel();


      //Add browser name
        tr.addColumn({
            width: "100%"
        }).innerHTML = browser;


      //Add switch
        td = tr.addColumn({
            padding: "0 5px"
        });
        var toggleSwitch = new javaxt.dhtml.Switch(td, {
            style: config.style.switch
        });
        toggleSwitch.onChange = function(){
            if (timer) clearTimeout(timer);
            timer = setTimeout(updateConfig, 800);
        };
        tr.toggleSwitch = toggleSwitch;


        return tr;
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

    var getPixel = javaxt.media.webapp.utils.getPixel;

    init();
};