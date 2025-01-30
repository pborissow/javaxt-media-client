if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};


//******************************************************************************
//**  ItemView
//******************************************************************************
/**
 *   Used to view a media item (e.g. image or video)
 *
 ******************************************************************************/


javaxt.media.webapp.ItemView = function (parent, config) {

    var me = this;
    var defaultConfig = {

    };

    var carousel;
    var footer;


    var retriever;
    var mediaItems = [];
    var currItem = 0;
    var numItems = -1;



    //**************************************************************************
    //** Constructor
    //**************************************************************************
    var init = function () {

        if (!config) config = {};
        merge(config, defaultConfig);


      //Create main div
        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0
        });
        mainDiv.className = "javaxt-media-view";

        me.el = mainDiv;
        addShowHide(me);
        me.hide();


      //Add button to hide the view
        var closeButton = createElement("div", mainDiv, {
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 1
        });
        closeButton.className = "close-button";
        closeButton.onclick = function(){
            me.hide();
        };


      //Create panels
        var table = createTable(mainDiv);
        createBody(table.addRow().addColumn({height: "100%" }));
        createFooter(table.addRow().addColumn());


        retriever = new javaxt.media.webapp.Retriever();
    };



  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        footer.hide();
        carousel.hideNav();
        carousel.getPanels().forEach((panel)=>{
            panel.div.innerHTML = "";
            panel.div.style.backgroundImage = "";
        });
    };


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update the viewer with a given media item
   */
    this.update = function(item, page, filter){
        me.clear();



      //Update visible panel when the carousel is ready
        var div = carousel.getVisiblePanel();
        if (!div){
            var timer;

            var getVisiblePanel = function(){
                var div = carousel.getVisiblePanel();
                if (!div){
                    timer = setTimeout(getVisiblePanel, 100);
                }
                else{
                    clearTimeout(timer);
                    updatePanel(div, item);
                }
            };

            timer = setTimeout(getVisiblePanel, 100);
        }
        else{
            updatePanel(div, item);
        }





        var isDirty = retriever.setFilter(filter);
        if (isDirty){ //Fetch siblings
            mediaItems = [];
            currItem = 0;
            numItems = -1;

            var fetchItems = function(){
                retriever.fetch({
                    success: function(items){

                        items.forEach((mediaItem)=>{
                            if (!mediaItem.isFolder){
                                mediaItems.push(mediaItem);
                                if (mediaItem.id==item.id){
                                    currItem = mediaItems.length-1;
                                }
                            }
                        });

                        if (retriever.getPage()<page){
                            fetchItems();
                        }
                        else{
                            if (mediaItems.length>1){
                                footer.show();
                                carousel.showNav();
                            }
                            else{
                                footer.hide();
                                carousel.hideNav();
                            }
                        }
                    }
                });

            };
            fetchItems();
        }
        else{ //Update currItem
            for (var i=0; i<mediaItems.length; i++){
                var mediaItem = mediaItems[i];
                if (mediaItem.id==item.id){
                    currItem = i;
                    break;
                }
            }
            if (mediaItems.length>1){
                footer.show();
                carousel.showNav();
            }
            else{
                footer.hide();
                carousel.hideNav();
            }
        }

    };



  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){

      //Create container
        var div = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });


      //Create carousel
        carousel = new javaxt.dhtml.Carousel(div, {
            loop: true,
            animate: true
        });

        carousel.getVisiblePanel = function(){
            var panels = carousel.getPanels();
            for (var i=0; i<panels.length; i++){
                if (panels[i].isVisible) return panels[i].div;
            }
            return false;
        };


      //Add panels to the carousel
        for (var i=0; i<2; i++){
            carousel.add(createElement("div", {
                height: "100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center"
            }));
        }


      //Watch for beforeChange events. Update the contents of the "next" panel
      //before the transition.
        carousel.beforeChange = function(currPanel, nextPanel, direction){

            if (direction=="next"){
                if (currItem+1<mediaItems.length){
                    currItem++;
                    updatePanel(nextPanel, mediaItems[currItem]);
                }
                else{ //reached the end of the list of media items

                  //Check whether we have a complete list of all available items
                    if (numItems<0){

                        var fetchItems = function(){
                            retriever.fetch({
                                success: function(items){
                                    if (items.length===0){
                                        currItem=0;
                                        numItems = mediaItems.length;
                                        updatePanel(nextPanel, mediaItems[currItem]);
                                    }
                                    else{

                                        items.forEach((mediaItem)=>{

                                            var newItems = 0;
                                            if (!mediaItem.isFolder){
                                                mediaItems.push(mediaItem);
                                                newItems++;
                                            }

                                            if (newItems===0){
                                                fetchItems();
                                            }
                                            else{
                                                currItem++;
                                                updatePanel(nextPanel, mediaItems[currItem]);
                                            }
                                        });
                                    }

                                }
                            });

                        };
                        fetchItems();

                    }
                    else{
                        currItem=0;
                        updatePanel(nextPanel, mediaItems[currItem]);
                    }
                }
            }
            else if (direction=="back"){

                if (currItem===0){ //reached the start of the list of media items


                  //Check whether we have a complete list of all available items
                    if (numItems<0){

                        //TODO: fetch all items?

                    }
                    else{
                        currItem = mediaItems.length-1;
                        updatePanel(nextPanel, mediaItems[currItem]);
                    }
                }
                else{
                    currItem--;
                    updatePanel(nextPanel, mediaItems[currItem]);
                }
            }


        };




      //Add button to move left
        var leftButton = createElement("div", div, {
            position: "absolute",
            top: "50%",
            left: 0,
            zIndex: 1
        });
        leftButton.className = "move-left";
        leftButton.onclick = function(){
            carousel.back();
        };
        addShowHide(leftButton);


      //Add button to move right
        var rightButton = createElement("div", div, {
            position: "absolute",
            top: "50%",
            right: 0,
            zIndex: 1
        });
        rightButton.className = "move-right";
        rightButton.onclick = function(){
            carousel.next();
        };
        addShowHide(rightButton);


        carousel.showNav = function(){
            leftButton.show();
            rightButton.show();
        };

        carousel.hideNav = function(){
            leftButton.hide();
            rightButton.hide();
        };

    };


  //**************************************************************************
  //** updatePanel
  //**************************************************************************
    var updatePanel = function(div, item){
        var img = createElement("img", div, {
            display: "none"
        });
        img.panel = div;

        img.onload = function(){
            this.panel.style.backgroundImage = "url(\"" +  this.src + "\")";
            this.parentNode.removeChild(this);
        };

        img.onerror = function(){
            this.panel.className += " not-available";
            this.parentNode.removeChild(this);
        };


        var rect = javaxt.dhtml.utils.getRect(div);
        img.src = "image?width=" + rect.width + "&id=" + item.id;



        get("/MediaItem?id=" + item.id, {
            success: function(text){
                var mediaItem = JSON.parse(text);
                //console.log(mediaItem);
                console.log(mediaItem.info);
            }
        });
    };



  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){
        footer = createElement("div", parent, "footer");
        addShowHide(footer);

        //
        var backButton = createElement("div", footer, {
            display: "inline-block"
        });
        backButton.className = "back-button";
        backButton.onclick = function(){
            carousel.back();
        };


        var stopButton = createElement("div", footer, {
            display: "inline-block"
        });
        stopButton.className = "stop-button";
        stopButton.onclick = function(){

        };


        var playButton = createElement("div", footer, "play-button");
        playButton.onclick = function(){

        };


        var nextButton = createElement("div", footer, "next-button");
        nextButton.onclick = function(){
            carousel.next();
        };

    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var createTable = javaxt.dhtml.utils.createTable;
    var merge = javaxt.dhtml.utils.merge;
    var get = javaxt.dhtml.utils.get;

    init();
};