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

  //Components
    var carousel, footer, button = {};

  //Carousel-specific variables
    var retriever;
    var mediaItems = [];
    var currItem = 0;
    var numItems = -1;

  //Current/visible item
    var mediaItem = null;
    var width, height;
    var visibleDiv;


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


      //Watch for keyboard events
        document.addEventListener("keydown", function(e){
            if (!me.isVisible()) return;
            if (e.keyCode==39) carousel.next();
            else if (e.keyCode==37) carousel.back();
        });


      //Instantiate Retriever
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

        mediaItem = null;
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
            animate: true,
            slideOver: true
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
                position: "relative",
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
        visibleDiv = div;

        img.onload = function(){
            this.panel.style.backgroundImage = "url(\"" +  this.src + "\")";
            width = this.width;
            height = this.height;
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
                mediaItem = JSON.parse(text);
            }
        });
    };



  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){
        footer = createElement("div", parent, "footer center noselect");
        addShowHide(footer);
        var tr = createTable(footer).addRow();


      //Add play/pause button
        button["play"] = createPlayButton(tr.addColumn(), (isSelected)=>{
            console.log("isPlaying", isSelected);
            if (isSelected){
                startSlideshow();
            }
            else{
                stopSlideshow();
            }
        });


      //Add face detection toggle button
        button["face"] = createButton("face button", tr.addColumn(), (isSelected)=>{
            if (isSelected){
                if (mediaItem.faces){
                    showFaces();
                }
                else{
                    get("/Features?item=" + mediaItem.id + "&label=FACE" +
                        "&format=json&fields=coordinates", {
                        success: function(text){
                            mediaItem.faces = JSON.parse(text);
                            showFaces();
                        }
                    });
                }
            }
            else{
                hideFaces();
            }
        });


      //Add info/metadata toggle button
        button["info"] = createButton("info button", tr.addColumn(), (isSelected)=>{
            if (isSelected) console.log("Show info");
            else console.log("hide info");
        });


      //Add like toggle button
        button["like"] = createButton("like button", tr.addColumn(), (isSelected)=>{
            if (isSelected) console.log("Like!");
            else console.log("no like...");
        });

    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(icon, parent, onClick){
        var button = createElement("div", parent, icon);
        button.onclick = function(){
            var isSelected = this.isSelected();
            if (isSelected) this.deselect();
            else this.select();
            onClick.apply(this, [!isSelected]);
        };
        button.select = function(){
            if (!this.isSelected()) this.classList.add("selected");
        };
        button.deselect = function(){
            this.classList.remove("selected");
        };
        button.isSelected = function(){
            return (this.className.indexOf("selected")>-1);
        };
        addShowHide(button);
        return button;
    };


  //**************************************************************************
  //** createPlayButton
  //**************************************************************************
    var createPlayButton = function(parent, onClick){

        var button = createElement("div", parent, "play-button center");
        createElement("div", button, "pause-left");
        createElement("div", button, "pause-right");
        createElement("div", button, "play-top");
        createElement("div", button, "play-bottom");



        var className = "pause";
        button.isPaused = function(){
            return this.className.indexOf(className)>-1;
        };

        button.toggle = function(){
            if (this.isPaused()) this.classList.remove(className);
            else this.classList.add(className);
        };

        button.pause = function(){
            if (!this.isPaused()) this.classList.add(className);
        };

        button.play = function(){
            if (this.isPaused()) this.classList.remove(className);
        };

        button.pause();


      //Process play/pause button events
        button.onclick = function() {
            button.toggle();
            onClick.apply(this, [!this.isPaused()]);
        };

        return button;
    };


  //**************************************************************************
  //** showFaces
  //**************************************************************************
    var showFaces = function(){

        console.log(width, height);
        console.log(mediaItem.info.width, mediaItem.info.height);

      //Find upper left corner of image in DOM space
        //var rect = javaxt.dhtml.utils.getRect(visibleDiv);


      //Add rectangles
        mediaItem.faces.forEach((face)=>{
            var rect = face.coordinates.rect;
            console.log(rect);
        });
    };


  //**************************************************************************
  //** hideFaces
  //**************************************************************************
    var hideFaces = function(){

    };


  //**************************************************************************
  //** startSlideshow
  //**************************************************************************
    var startSlideshow = function() {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
        else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        }
        else if (elem.msRequestFullscreen) { /* IE11 */
          elem.msRequestFullscreen();
        }
    };


  //**************************************************************************
  //** stopSlideshow
  //**************************************************************************
    var stopSlideshow = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
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