//******************************************************************************
//**  AdminSettings
//******************************************************************************
/**
 *   Reusable panel used to render a header and a carousel with 2 pages. The
 *   first page contains a list of settings. When a user clicks on a setting in
 *   the list, a second page is slide into view. Use the addRow() method to
 *   add an item to the list of settings in the first page.
 *
 ******************************************************************************/

javaxt.media.webapp.AdminSettings = function(parent, config) {

    var me = this;
    var defaultConfig = {

    };

    var headerRow, header, menu;


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



      //Create main table
        var table = createTable(parent);
        table.className = "javaxt-media-settings-admin";


      //Create header
        headerRow = table.addRow().addColumn();


      //Create body
        var td = table.addRow().addColumn({
            height: "100%",
            padding: "15px",
            verticalAlign: "top"
        });


      //Add carousel
        menu = createMenu(td, config);


        me.el = table;
        addShowHide(me);
    };



    this.clear = function(){
        menu.carousel.back();
    };


    this.update = function(){
        menu.carousel.back();
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, data){
        menu.notify(op, model, data);
    };


  //**************************************************************************
  //** setHeader
  //**************************************************************************
    this.setHeader = function(config){
        headerRow.innerHTML = "";

        header = createHeader(headerRow, {
            icon: config.icon,
            title: config.title,
            onClick: function(){
                if (menu.carousel) menu.carousel.back();
            }
        });

    };


  //**************************************************************************
  //** addRow
  //**************************************************************************
    this.addRow = function(config){
        menu.addRow({
            icon: config.icon,
            title: config.title,
            onClick: function(){
                raisePanel(config.cls, this);
            }
        });
    };


  //**************************************************************************
  //** raisePanel
  //**************************************************************************
    var raisePanel = function(cls, rowConfig){
        var p = menu.raisePanel(cls);

        var title = rowConfig.title;
        var icon = rowConfig.icon;
        if (p.getTitle) title = p.getTitle();
        if (p.getIcon) icon = p.getIcon();
        header.update(title, icon);
    };


  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(parent, config){


        var div = createElement("div", parent, "header noselect");


        var header = createElement("div", div, {
            display: "inline-block"
        });


        var icon = createElement("div", header, config.icon);

        var title = createElement("div", header, "header-text");
        title.innerText = config.title;


        var subtitle = createElement("div", div, "subheader noselect");
        addShowHide(subtitle);
        subtitle.hide();


        var backIcon = createElement("div", subtitle, "back icon");

        var backText = createElement("div", subtitle);
        backText.innerText = config.title;


        subtitle.onclick = function(){
            subtitle.hide();
            title.innerText = config.title;
            icon.className = config.icon;
            if (config.onClick) config.onClick();
        };


        return {
            update: function(t, i){
                title.innerText = t;
                icon.className = i;
                subtitle.show();
            },
            getConfig: function(){
                return config;
            }
        };

    };


  //**************************************************************************
  //** createMenu
  //**************************************************************************
    var createMenu = function(parent, config){


      //Create container
        var div = createElement("div", parent);
        div.className = "";
        div.style.display = "inline";


      //Create carousel
        var carousel = new javaxt.dhtml.Carousel(div, {
            drag: false,
            loop: false,
            animate: true,
            animationSteps: 250,
            transitionEffect: "easeInOutCubic",
            fx: config.fx
        });


      //Create 2 panels for the carousel
        for (var i=0; i<2; i++){
            carousel.add(createElement("div", {
                height: "100%"
            }));
        }


      //Get first panel
        var mainDiv = carousel.getPanels()[0].div;


      //Add table
        var div = createElement("div", mainDiv, "config-table");

        var table = createTable(div);
        table.style.height = "";
        var phantomRow = table.addRow();
        var td = phantomRow.addColumn();
        td.style.width = "36px";
        var td = phantomRow.addColumn();
        td.style.width = "100%";



        var panels = [];


        return {

            el: div,

            carousel: carousel,

            clear: function(){
                phantomRow = phantomRow.cloneNode(true);
                table.clear();
                var tbody = table.firstChild;
                tbody.appendChild(phantomRow);
            },

            addRow: function(config){
                var row = table.addRow("config-row arrow noselect");

              //Add icon
                createElement("div", row.addColumn(), config.icon);

              //Add text
                row.addColumn().innerHTML = config.title;

                row.onclick = function(){
                    if (config.onClick) config.onClick();
                };
            },

            raisePanel: function(cls){

                var p;
                panels.forEach((panel)=>{
                    if (panel instanceof cls){
                        p = panel;
                    }
                    else{
                        panel.hide();
                    }
                });


                if (p){
                    p.show();
                }
                else{
                    var d = carousel.getPanels()[1].div;
                    p = new cls(d, config);
                    panels.push(p);
                }
                p.update();
                carousel.next();

                return p;
            },


            notify: function(op, model, data){
                panels.forEach((panel)=>{
                    if (panel.notify) panel.notify(op, model, data);
                });
            }

        };

    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;

    init();
};