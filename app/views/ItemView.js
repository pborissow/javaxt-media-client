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


  //Context menu-specific variables
    var contextMenu;
    var menuTimer;


  //Carousel-specific variables
    var retriever;
    var mediaItems = [];
    var currItem = 0;
    var numItems = -1;
    var dragging = false;
    var sliding = false;

  //Current/visible item
    var mediaItem = null;
    var width, height;
    var visibleDiv;

  //Variables used to help resize images
    var thumbnails = [];

  //Slideshow related variables
    var isFullScreen = false;
    var timer;
    var fx;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function () {

        if (!config) config = {};
        merge(config, defaultConfig);

        fx = config.fx;
        if (!fx) fx = new javaxt.dhtml.Effects();


      //Create main div
        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            overflow: "hidden",
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
            if (button["play"].isSelected()) button["play"].click();
            if (videojs.players) {
                Object.values(videojs.players).forEach((player)=>{
                    if (player){
                        player.pause();
                        player.dispose();
                    }
                });
            }
            me.hide();
            if (isFullScreen) exitFullScreen();
        };


      //Create panels
        var table = createTable(mainDiv);
        createBody(table.addRow().addColumn({height: "100%" }));
        createFooter(table.addRow().addColumn());


      //Create context menu
        contextMenu = new javaxt.dhtml.Callout(mainDiv,{
            style: config.style.callout
        });


      //Watch for keyboard events
        document.addEventListener("keydown", function(e){
            if (!me.isVisible()) return;
            if (e.keyCode==39) carousel.next();
            else if (e.keyCode==37) carousel.back();
            else if (e.keyCode==27){ //escape
                //console.log("stop!");
                //if (isFullScreen) closeButton.click();
            }
        });


      //Instantiate Retriever
        retriever = new javaxt.media.webapp.Retriever();
    };



  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        if (timer) clearInterval(timer);
        footer.hide();
        carousel.hideNav();
        carousel.getPanels().forEach((panel)=>{
            panel.div.innerHTML = "";
            panel.div.style.backgroundImage = "";
        });
        contextMenu.hide();
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


      //Update filter
        var isDirty = retriever.setFilter(filter);
        if (isDirty) mediaItems = [];


      //Fetch mediaItems as needed and update the view
        if (isDirty || retriever.getPage()<page){
            numItems = -1;

            var fetchItems = function(){
                retriever.fetch({
                    success: function(items){

                      //Update mediaItems
                        items.forEach((mediaItem)=>{
                            if (!mediaItem.isFolder) mediaItems.push(mediaItem);
                        });


                      //Fetch more items as needed or update the view
                        if (retriever.getPage()<page){
                            fetchItems();
                        }
                        else{
                            updateView(item);
                        }
                    }
                });

            };
            fetchItems();
        }
        else{
            updateView(item);
        }
    };


  //**************************************************************************
  //** updateView
  //**************************************************************************
  /** Used to find an item in mediaItems and update the view
   */
    var updateView = function(item){

      //Find item
        currItem = 0;
        for (var i=0; i<mediaItems.length; i++){
            var mediaItem = mediaItems[i];
            if (mediaItem.id==item.id){
                currItem = i;
                break;
            }
        }

      //Update the view
        if (mediaItems.length>1){
            footer.show();
            carousel.showNav();
        }
        else{
            footer.hide();
            carousel.hideNav();
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
            slideOver: true,
            fx: fx
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


      //Watch for beforeChange events
        carousel.beforeChange = function(currPanel, nextPanel, direction){
            sliding = true;


          //Pause all video players
            if (videojs.players) {
                Object.values(videojs.players).forEach((player)=>{
                    if (player) player.pause();
                });
            }


          //Update opacity if the slideshow is playing
            if (timer){
                //if (button["face"].isSelected()) button["face"].click();
                nextPanel.style.opacity = 0;
                fx.fadeOut(currPanel, "ease", 500, function(){
                    this.style.display = "";
                });
            }


          //Update the contents of the "next" panel before the transition.
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

                                        var newItems = 0;
                                        items.forEach((mediaItem)=>{
                                            if (!mediaItem.isFolder){
                                                mediaItems.push(mediaItem);
                                                newItems++;
                                            }
                                        });

                                        if (newItems===0){
                                            fetchItems();
                                        }
                                        else{
                                            currItem++;
                                            updatePanel(nextPanel, mediaItems[currItem]);
                                        }
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


      //Watch for onChange events
        carousel.onChange = function(currPanel, prevPanel){

            var hideOverlay = function(){
                var overlay = getOverlay();
                if (overlay) overlay.show();
                sliding = false;
            };

            if (timer){
                fx.fadeIn(currPanel, "easeIn", 1000, ()=>{
                    prevPanel.style.opacity = "";
                    hideOverlay();
                });
            }
            else{
                currPanel.style.opacity = "";
                hideOverlay();
            }
        };


      //Watch for drag events
        carousel.onDragStart = function(currPanel){
            dragging = true;
            contextMenu.hide();
            carousel.getPanels().forEach((panel)=>{
                if (panel.div!==currPanel){
                    panel.div.style.opacity = 0;
                }
            });
        };
        carousel.onDragEnd = function(){
            dragging = false;
            carousel.getPanels().forEach((panel)=>{
                panel.div.style.opacity = "";
            });
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


        var resizeTimeout;
        carousel.onResize = function(){
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function(){
                resizePanel();
            }, 100);
        };
    };


  //**************************************************************************
  //** updatePanel
  //**************************************************************************
    var updatePanel = function(div, item){

        visibleDiv = div;
        visibleDiv.innerHTML = "";
        visibleDiv.style.backgroundImage = "none";

        mediaItem = {};
        thumbnails = [];

        get("/MediaItem?id=" + item.id, {
            success: function(text){
                mediaItem = JSON.parse(text);

                get("/Thumbnails?id=" + item.id, {
                    success: function(text){
                        JSON.parse(text).forEach((entry)=>{
                            var arr = entry.split('x');
                            thumbnails.push([parseInt(arr[0]), parseInt(arr[1])]);
                        });

                        var rect = javaxt.dhtml.utils.getRect(carousel.el);
                        updateImage(rect.width, rect.height);
                    }
                });
            }
        });
    };


  //**************************************************************************
  //** resizePanel
  //**************************************************************************
    var resizePanel = function(){
        if (width && thumbnails){

            var rect = javaxt.dhtml.utils.getRect(carousel.el);
            var panelWidth = rect.width;
            var panelHeight = rect.height;
            var optimalWidth;

            // Calculate the aspect ratio of the current image
            var aspectRatio = width / height;
            var isVertical = aspectRatio < 1;

            for (var i=0; i<thumbnails.length; i++){
                var thumbnail = thumbnails[i];
                var w = thumbnail[0];
                var h = thumbnail[1];

                if (isVertical) {
                    // For vertical images, check if thumbnail fits within panel height
                    if (h <= panelHeight) {
                        optimalWidth = w;
                        break;
                    }
                } else {
                    // For horizontal images, check if thumbnail fits within panel width
                    if (w <= panelWidth) {
                        optimalWidth = w;
                        break;
                    }
                }
            }


            if (optimalWidth != width) {
                console.log("width: " + width + "->" + optimalWidth);
                updateImage(optimalWidth);
            }
        }

        resizeFaces();
    };


  //**************************************************************************
  //** updateImage
  //**************************************************************************
    var updateImage = function(w, h){

        var img = createElement("img", parent, {
            display: "none"
        });


        img.onload = function(){
            visibleDiv.style.backgroundImage = "url(\"" +  this.src + "\")";
            width = this.width;
            height = this.height;

            var rect = javaxt.dhtml.utils.getRect(carousel.el);
            //if (width>rect.width || height>rect.height) visibleDiv.style.backgroundSize = "contain";
            //else visibleDiv.style.backgroundSize = "";


            if (button["face"].isSelected()) showFaces();

            this.parentNode.removeChild(this);

            if (mediaItem.type=="video"){
                var videoPlayer = createVideoPlayer();
                videoPlayer.poster(this.src);
                videoPlayer.src({type: 'video/mp4', src: '/video?id=' + mediaItem.id});
            }
        };


        img.onerror = function(){
            visibleDiv.className += " not-available";
            parent.removeChild(this);
        };


        img.src = "image?width=" + w + "&id=" + mediaItem.id;
    };


  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){
        footer = createElement("div", parent, "footer center noselect");
        addShowHide(footer);
        var tr = createTable(footer).addRow();


      //Add play/pause button
        button["play"] = createButton("slideshow button", tr.addColumn(), (isSelected)=>{
            if (isSelected) startSlideshow();
            else stopSlideshow();
        });


      //Add face detection toggle button
        button["face"] = createButton("face button", tr.addColumn(), (isSelected)=>{
            if (isSelected) showFaces();
            else hideFaces();
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


      //Set widths
        var numButtons = tr.childNodes.length;
        for (var i=0; i<numButtons; i++){
            tr.childNodes[i].style.width = ((100/numButtons))+"%";
        }

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
  //** createVideoPlayer
  //**************************************************************************
    var createVideoPlayer = function(){

        var v = getOverlay("video-js");
        if (v){
            var p = v.parentNode;
            p.removeChild(v);
        }

      //Get dimensions of the overlay. We'll use the same dimensions for the
      //video player.
        var overlay = getOverlay();
        var hideOverlay = false;
        if (overlay){
            hideOverlay = !overlay.isVisible();
        }
        else{
            overlay = createOverlay();
            hideOverlay = true;
        }


      //Create video element
        v = createElement("video", visibleDiv, {
            width: overlay.style.width,
            height: overlay.style.height,
            left: overlay.style.left,
            top: overlay.style.top,
            position: "absolute"
        });
        v.className = "video-js";



      //Create video player
        var videoPlayer = videojs(v, {
            controls: true,
            autoplay: false,
            preload: 'auto'
        });
        videoPlayer.on('play', function(){
            if (button["play"].isSelected()) button["play"].click();
            if (button["face"].isSelected()) button["face"].click();
        });


      //The video player creates a div around the video element, copying all
      //the style elements of the video elements.
        onRender(v, function(){
            v.style.top = 0;
            v.style.left = 0;
        });


      //Hide overlay as needed
        if (hideOverlay) overlay.hide();


        return videoPlayer;
    };


  //**************************************************************************
  //** createOverlay
  //**************************************************************************
    var createOverlay = function(){

        var overlay = getOverlay();
        if (overlay) return overlay;


        overlay = createElement("div", visibleDiv, "overlay");
        overlay.style.position = "absolute";
        overlay.style.zIndex = 2;
        overlay.resize = function(){
            console.log("overlay.resize", this.parentNode);

            var rect = javaxt.dhtml.utils.getRect(this.parentNode);
            this.style.width = width+"px";
            this.style.height = height+"px";
            this.style.left = (rect.width-width)/2 + "px";
            this.style.top = (rect.height-height)/2 + "px";
        };
        overlay.resize();
        addShowHide(overlay);
        return overlay;
    };


  //**************************************************************************
  //** getOverlay
  //**************************************************************************
    var getOverlay = function(className){
        if (visibleDiv){
            if (!className) className = "overlay";
            for (var i=0; i<visibleDiv.childNodes.length; i++){
                var el = visibleDiv.childNodes[i];
                if (el.className.indexOf(className)>-1) return el;
            }
        }
        return null;
    };


  //**************************************************************************
  //** showFaces
  //**************************************************************************
    var showFaces = function(){

        var overlay = getOverlay();
        if (overlay && overlay.childNodes.length>0){
            resizeFaces(true);
            overlay.show();
            return;
        }


      //Get facial features and render rectangles
        var id = mediaItem.id ;
        get("/Features?item=" + mediaItem.id + "&label=FACE" +
            "&fields=id,coordinates&format=json", {
            success: function(text){
                if (mediaItem.id!==id) return;
                mediaItem.faces = JSON.parse(text);
                if (mediaItem.faces.length===0) return;

              //Create container for the faces
                var overlay = createOverlay();
                overlay.hide();


              //Compute scaling
                var w, h;
                var orientation = mediaItem.info.orientation;
                if (!orientation) orientation = 1;
                //console.log(orientation);
                if (orientation<5){
                    w = width/mediaItem.info.width;
                    h = height/mediaItem.info.height;
                }
                else{
                    w = width/mediaItem.info.height;
                    h = height/mediaItem.info.width;

                  //Hack for incorrect orientation (e.g. image was rotated
                  //but the orientation flag wasn't updated)
                    if (mediaItem.info.width<mediaItem.info.height){
                        w = width/mediaItem.info.width;
                        h = height/mediaItem.info.height;
                    }
                }


              //Add rectangles
                mediaItem.faces.forEach((face)=>{
                    var rect = face.coordinates.rect;


                    /* TODO: Rotate rectangle?
                    case 1: return; //"Top, left side (Horizontal / normal)"
                    case 2: flip(); break; //"Top, right side (Mirror horizontal)";
                    case 3: rotate(180); break; //"Bottom, right side (Rotate 180)";
                    case 4: {flip(); rotate(180);} break; //"Bottom, left side (Mirror vertical)";
                    case 5: {flip(); rotate(270);} break; //"Left side, top (Mirror horizontal and rotate 270 CW)";
                    case 6: rotate(90); break; //"Right side, top (Rotate 90 CW)";
                    case 7: {flip(); rotate(90);} break; //"Right side, bottom (Mirror horizontal and rotate 90 CW)";
                    case 8: rotate(270); break; //"Left side, bottom (Rotate 270 CW)";
                    */


                    var box = createElement("div", overlay, {
                        position: "absolute",
                        width: rect.w*w + "px",
                        height: rect.h*h + "px",
                        left: rect.x*w + "px",
                        top: rect.y*h + "px"
                    });
                    box.className = "face";
                    box.face = face;

                    box.onclick = function(e){
                        onFaceClick(this, e);
                    };

                    box.oncontextmenu = function(e){
                        onFaceClick(this, e);
                    };

                    box.onmouseover = function(e){

                      //Update context menu (show person's name)
                        if (this.face.person){
                            var innerDiv = contextMenu.getInnerDiv();
                            innerDiv.innerHTML = this.face.person;
                        }

                      //Show context menu
                        if (menuTimer) clearTimeout(menuTimer);
                        showMenu(this, e);
                    };

                    box.onmouseout = function(e){

                      //Hide context menu after a slight delay. The timer will
                      //be cancelled if the user
                        if (menuTimer) clearTimeout(menuTimer);
                        menuTimer = setTimeout(()=>{
                            contextMenu.hide();
                        }, 50);

                    };

                });

                if (!sliding) overlay.show();
            }
        });
    };


  //**************************************************************************
  //** hideFaces
  //**************************************************************************
    var hideFaces = function(){
        var overlay = getOverlay();
        if (overlay) overlay.hide();
    };


  //**************************************************************************
  //** resizeFaces
  //**************************************************************************
    var resizeFaces = function(forceResize){

        var overlay = getOverlay();
        if (overlay){
            if (forceResize===true || overlay.isVisible()){
                overlay.resize();
                var rect = javaxt.dhtml.utils.getRect(visibleDiv);
                overlay.style.left = (rect.width-width)/2 + "px";
                overlay.style.top = (rect.height-height)/2 + "px";
            }
        }
    };


  //**************************************************************************
  //** onFaceClick
  //**************************************************************************
    var onFaceClick = function(box, e){
        e.preventDefault();
        e.stopPropagation();


        if (box.face.person){
            console.log("show details", box.face.person);
        }
        else{
            if (menuTimer) clearTimeout(menuTimer);
            showMenu(box, e);
        }

    };


  //**************************************************************************
  //** showMenu
  //**************************************************************************
    var showMenu = function(box, e){
        if (dragging) return;

        var innerDiv = contextMenu.getInnerDiv();
        innerDiv.innerHTML = "";
        createMenu(box.face, innerDiv);


        var x = e.offsetX; //e.clientX;
        var y = e.offsetY; //e.clientY;

        var rect = javaxt.dhtml.utils.getRect(box);

        if (!e.button || e.button===0){
            x=rect.x+10;
            y=rect.y+rect.height-20;
        }
        else{
            x+=rect.x;
            y=rect.y+rect.height-20;
        }

        contextMenu.showAt(x, y, "below", "left");
    };


  //**************************************************************************
  //** createMenu
  //**************************************************************************
    var createMenu = function(face, parent){
        var menu = createElement("div", parent, "menu");

        menu.onmouseover = function(e){
            if (menuTimer) clearTimeout(menuTimer);
        };


        if (face.person){

            var editMenu = createElement("div", menu, "menu-item edit-user");
            editMenu.innerText = "Edit Person";
            editMenu.onclick = function(){
                console.log("editFace", face);
                contextMenu.hide();
            };

        }
        else{

            var editMenu = createElement("div", menu, "menu-item add-user");
            editMenu.innerText = "Tag Person";
            editMenu.onclick = function(){
                editFace(face);
                contextMenu.hide();
            };

            var deleteMenu = createElement("div", menu, "menu-item delete");
            deleteMenu.innerText = "Remove Rectangle";
            deleteMenu.onclick = function(){
                deleteFace(face);
                contextMenu.hide();
            };
        }
    };


  //**************************************************************************
  //** editFace
  //**************************************************************************
    var editFace = function(face){
        console.log("editFace", face);
    };


  //**************************************************************************
  //** deleteFace
  //**************************************************************************
    var deleteFace = function(face){

        del("/Feature?id=" + face.id, {
            success: function(){
                var overlay = getOverlay();
                if (overlay){
                    for (var i=0; i<overlay.childNodes.length; i++){
                        var box = overlay.childNodes[i];
                        if (box.face){
                            if (box.face.id===face.id){
                                overlay.removeChild(box);
                                return;
                            }
                        }
                    }
                }
            },
            failure: function(request){
                alert(request);
            }
        });

    };


  //**************************************************************************
  //** startSlideshow
  //**************************************************************************
    var startSlideshow = function() {

      //Enter fullscreen
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
        isFullScreen = true;


      //Update carousel after resize (just in case)
        setTimeout(carousel.resize, 800);


      //Start slideshow
        timer = setInterval(carousel.next, 4000);
    };


  //**************************************************************************
  //** stopSlideshow
  //**************************************************************************
    var stopSlideshow = function() {
        if (timer){
            clearInterval(timer);
            timer = null;
        }
    };


  //**************************************************************************
  //** exitFullScreen
  //**************************************************************************
    var exitFullScreen = function(){
        isFullScreen = false;
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }

        setTimeout(carousel.resize, 800);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var createTable = javaxt.dhtml.utils.createTable;
    var onRender = javaxt.dhtml.utils.onRender;
    var merge = javaxt.dhtml.utils.merge;
    var del = javaxt.dhtml.utils.delete;
    var get = javaxt.dhtml.utils.get;

    init();
};