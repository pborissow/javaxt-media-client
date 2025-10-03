if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};


//******************************************************************************
//**  Thumbnail View
//******************************************************************************
/**
 *   Used to render thumbnails of images and folders.
 *
 ******************************************************************************/

javaxt.media.webapp.ThumbnailView = function(parent, config) {

    var me = this;
    var defaultConfig = {

      /** Max size of an image rendered in a thumbnail div
       */
        size: 300,

        itemsPerRow: 5,
        numRowsPerRequest: 10,


        style: {

            mask: {
                backgroundColor: "rgba(0,0,0,0.5)"
            },

            iscroll: javaxt.dhtml.style.default.iscroll
        }
    };



    var mask, tiles, noresults; //components
    var retriever; //instance of the Retriever class
    var isDirty = true; //used to determine whether to refresh the tiles on tiles.update()






  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


        if (!config) config = {};
        merge(config, defaultConfig);


        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        mainDiv.className = "javaxt-thumbnail-view";

        createTiles(mainDiv);
        createMask(mainDiv);
        createNoResults(mainDiv);


        retriever = new javaxt.media.webapp.Retriever({
            limit: config.numRowsPerRequest*config.itemsPerRow
        });

        me.el = mainDiv;
        addShowHide(me);
    };


  //**************************************************************************
  //** onClick
  //**************************************************************************
    this.onClick = function(item){};


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        isDirty = true;
        tiles.clear();
        retriever.clear();
        if (noresults) noresults.hide();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(filter){

        //Don't call clear! Leave that to the caller...

        if (filter) me.setFilter(filter);
        tiles.update();
    };


  //**************************************************************************
  //** setFilter
  //**************************************************************************
  /** Used to update the current filter.
   */
    this.setFilter = function(filter){
        isDirty = retriever.setFilter(filter);
    };


  //**************************************************************************
  //** getFilter
  //**************************************************************************
  /** Returns a copy of the current filter. Use the setFilter() to update.
   */
    this.getFilter = function(){
        retriever.getFilter();
    };


  //**************************************************************************
  //** getRetriever
  //**************************************************************************
    this.getPage = function(){
        return retriever.getPage();
    };



  //**************************************************************************
  //** getItems
  //**************************************************************************
  /** Returns all the items currently loaded in the view.
   */
    this.getItems = function(){
        var items = [];
        tiles.forEachRow((row)=>{
            items.push(...row.record);
        });
        return items;
    };



  //**************************************************************************
  //** createTiles
  //**************************************************************************
    var createTiles = function(parent){


      //Create containers
        var outerDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        addShowHide(outerDiv);

        var innerDiv = createElement("div", outerDiv, {
            width: "100%",
            position: "absolute"
        });

        var thumbnailContainer = createElement("div", innerDiv, {
            position: "relative",
            textAlign: "center",
            overflow: "hidden"
        });


      //Set local variables
        var scrollEnabled = true;
        var iscroll;


      //Create tiles object
        tiles = {
            show: function(){
                outerDiv.show();
            },
            hide: function(){
                outerDiv.hide();
            }
        };


      //Add clear() method
        tiles.clear = function(){

            var thumbnails = thumbnailContainer.childNodes;
            while (thumbnails.length>0){
                var t = thumbnails[0];
                var p = t.parentNode;
                p.removeChild(t);
                t = null;
            }


            noresults.hide();
            tiles.show();
            mask.hide();
            if (iscroll) iscroll.refresh();
        };


      //Add load() method
        tiles.load = function(){
            mask.show();
            retriever.fetch({
                success: function(items){

                    items.forEach((item)=>{
                        createThumbnail(item, thumbnailContainer);
                    });

                    if (iscroll) iscroll.refresh();
                    mask.hide();
                },
                failure: function(request){
                    mask.hide();

                  //Return error
                    //callback.apply(me, [request]);

                }
            });
        };



      //Add update() method
        tiles.update = function(){
            if (isDirty){
                tiles.clear();
                tiles.load();
                isDirty = false;
            }
        };


      //Function used to process scroll events and load new tiles
        var onScroll = function(y){
            var lastTile = thumbnailContainer.lastChild;
            if (!lastTile) return;


          //Calculate row number associated with the last tile
            var rowHeight = lastTile.offsetHeight;
            var lastRow = Math.ceil(lastTile.offsetTop/rowHeight);
            if (lastRow==0) lastRow = 1;


          //Calculate start and end rows currently visible
            var startRow = Math.ceil(y/rowHeight);
            if (startRow==0) startRow = 1;

            var h = outerDiv.offsetHeight;
            var endRow = Math.ceil((y+h)/rowHeight);
            if (endRow>lastRow) endRow = lastRow;



            //console.log("Showing rows " + startRow + "-" + endRow + " (last row is " + lastRow + ")", retriever.isEOF());

            if (endRow==lastRow && endRow>1){
                if (!retriever.isEOF()){
                    tiles.load();
                }
            }
        };




      //Add scroll bar and watch for scroll events
        onRender(outerDiv, function(){

            if (typeof IScroll !== 'undefined'){
                outerDiv.style.overflowY = 'hidden';

              //Instantiate iScroll
                iscroll = new IScroll(outerDiv, {
                    scrollbars: config.style.iscroll ? "custom" : true,
                    mouseWheel: true, //enable scrolling with mouse wheel
                    fadeScrollbars: false,
                    hideScrollbars: false
                });
                if (config.style.iscroll){
                    javaxt.dhtml.utils.setStyle(iscroll, config.style.iscroll);
                }

              //Override the iscroll's translate method so we can catch all
              //scroll movements and prevent scrolling as needed
                var translate = iscroll._translate;
                iscroll._translate = function(x, y){
                    if (!scrollEnabled) return;
                    translate.apply(iscroll, arguments);
                    onScroll(-iscroll.y);
                };


              //Watch for scroll events
                iscroll.on('beforeScrollStart', function(){
                    onScroll(-iscroll.y);
                });

                iscroll.on('scrollStart', function(){
                    onScroll(-iscroll.y);
                });

                iscroll.on('scrollEnd', function(){
                    onScroll(-iscroll.y);
                });


              //Watch for resize events
                addResizeListener(parent, function(){
                    mask.resize();
                    iscroll.refresh();
                    onScroll(-iscroll.y);
                });

            }
            else{
                outerDiv.style.overflowX = 'auto';
                if (config.overflow===false) outerDiv.style.overflowY = 'hidden';

              //Watch for scroll events
                outerDiv.onscroll = function(e){

                    if (!scrollEnabled){ //not tested...
                        e.preventDefault();
                        return;
                    }

                    onScroll(outerDiv.scrollTop);
                };


              //Watch for resize events
                addResizeListener(parent, function(){
                    mask.resize();
                    onScroll(outerDiv.scrollTop);
                });
            }

        });

    };


  //**************************************************************************
  //** createThumbnail
  //**************************************************************************
    var createThumbnail = function(item, div){

      //Create thumbnail div
        var thumbnail = createElement("div", div, "thumbnail");
        thumbnail.item = item;

      //Populate div with an image or folder icon
        if (item.isFolder){

          //Add folder icon to the thumbnail div
            createElement("div", thumbnail, "folder-icon");
            createElement("div", thumbnail).innerText = item.name;
        }
        else{

          //Create temp image and set the thumbnail backgroundImage when the
          //image loads. If the image fails to load, the thumbnail class name
          //is updated instead.
            var img = createElement("img", thumbnail, {
                display: "none"
            });
            img.thumbnail = thumbnail;
            img.onload = function(){
                this.thumbnail.style.backgroundImage = "url(\"" +  this.src + "\")";
                this.parentNode.removeChild(this);

              //Overlay video icon as needed
                if (this.thumbnail.item.type=="video"){
                    var div = createElement("div", this.thumbnail, "video-js");
                    div = createElement("div", div, "vjs-big-play-button");
                    createElement("span", div, "vjs-icon-placeholder");
                }

            };
            img.onerror = function(){
                this.thumbnail.className += " not-available";
                this.parentNode.removeChild(this);
            };

            img.src = "image?width=" + config.size + "&id=" + item.id;

        }

      //Process click events
        thumbnail.onclick = function(){
            me.onClick(this.item);
        };

    };


  //**************************************************************************
  //** createMask
  //**************************************************************************
    var createMask = function(parent){

        mask = createElement("div", parent, config.style.mask);
        mask.style.position = "absolute";
        mask.style.top = 0;
        mask.style.left = 0;

        var resize = function(){
            var rect = javaxt.dhtml.utils.getRect(me.el);
            mask.style.top = rect.top;
            mask.style.left = rect.left;
            mask.style.width = rect.width + "px";
            mask.style.height = rect.height + "px";
        };

        mask.show = function(){
            resize();
            var highestElements = getHighestElements(parent);
            var zIndex = highestElements.zIndex;
            if (!highestElements.contains(mask)) zIndex++;
            mask.zIndex = zIndex;
            mask.style.visibility = '';
            mask.style.display = '';
        };
        mask.hide = function(){
            mask.style.visibility = 'hidden';
            mask.style.display = 'none';
        };
        mask.isVisible = function(){
            return !(mask.style.visibility === 'hidden' && mask.style.display === 'none');
        };
        mask.resize = function(){
            if (mask.isVisible()){
                resize();
            }
        };
        mask.hide();
    };


  //**************************************************************************
  //** createNoResults
  //**************************************************************************
    var createNoResults = function(parent){
        noresults = createElement("div", parent, "no-search-results middle noselect");
        addShowHide(noresults);
        noresults.hide();
        createElement("div", noresults, "icon");
        createElement("div", noresults).innerText = "No images found";
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var onRender = javaxt.dhtml.utils.onRender;
    var merge = javaxt.dhtml.utils.merge;


    init();
};