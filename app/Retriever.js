if(!javaxt) var javaxt={};
if(!javaxt.media) javaxt.media={};
if(!javaxt.media.webapp) javaxt.media.webapp={};


//******************************************************************************
//**  Retriever Class
//******************************************************************************
/**
 *   Used to fetch media items and folders from the server. Skips duplicate
 *   images using perceptual hashes.
 *
 ******************************************************************************/

javaxt.media.webapp.Retriever = function(config) {

    var me = this;
    var defaultConfig = {

        url: "index",
        limit: 50,

        /** Hamming distance to phash */
        similarityThreshold: 5

    };



    var filter = null; //null is important!
    var imageHashes = {};
    var currPage = 0;

    var eof = false;
    var pageRequests = new Set();
    var loading = false;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function () {

        if (!config) config = {};
        merge(config, defaultConfig);

    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        filter = null;
        clear();

        eof = false;
        if (loading){
            //TODO: stop requests
        }
    };

    var clear = function(){
        currPage = 0;
        imageHashes = {};
        pageRequests.clear();
    };



  //**************************************************************************
  //** setFilter
  //**************************************************************************
  /** Used to update the current filter.
   */
    this.setFilter = function(_filter){


        var orgFilter;
        if (filter){
            orgFilter = me.getFilter();
            Object.keys(filter).forEach((key)=>{
                delete filter[key];
            });
        }
        else{
            orgFilter = null;
            filter = {};
        }


        if (_filter){
            for (var key in _filter) {
                if (_filter.hasOwnProperty(key)){
                    var val = _filter[key];
                    if (val) val = JSON.parse(JSON.stringify(val));
                    filter[key] = val;
                }
            }
        }



        var isDirty = orgFilter ? javaxt.dhtml.utils.isDirty(filter, orgFilter) : true;
        if (isDirty) clear();


        return isDirty;
    };


  //**************************************************************************
  //** getFilter
  //**************************************************************************
  /** Returns a copy of the current filter. Use the setFilter() to update.
   */
    this.getFilter = function(){
        if (filter) return JSON.parse(JSON.stringify(filter));
        else return {};
    };



  //**************************************************************************
  //** getPage
  //**************************************************************************
    this.getPage = function(){
        return currPage;
    };


  //**************************************************************************
  //** fetch
  //**************************************************************************
  /** Used to fetch the next page of records
   */
    this.fetch = function(callback){

      //Logic used to block concurrent requests
        var page = currPage+1;
        if (pageRequests.has(page)) return;
        if (loading) return;
        loading = true;
        pageRequests.add(page);


      //Update currPage number
        currPage++;



      //Parse filter
        var path = "";
        var params = {};
        if (filter){
            for (var key in filter) {
                if (filter.hasOwnProperty(key)){

                    if (key=="path"){
                        for (var i=0; i<filter.path.length; i++){
                            path += "/" + encodeURIComponent(filter.path[i]);
                        }
                    }
                    else{
                        params[key] = filter[key];
                    }
                }
            }
        }



      //Set url
        var limit = config.limit;
        var url = config.url + path + "?page=" + currPage + "&limit=" + limit;



        var orgPage = currPage;
        var currImages = {};
        var numItems = 0;


        var getItems = function(page){


            if (page>orgPage)
            url = url.replace("page=" + (page-1), "page=" + page);


            post(url, params, {
                success: function(text){

                    var numAdditions = 0;
                    var items = JSON.parse(text);
                    for (var i=0; i<items.length; i++){
                        var item = items[i];
                        item.isFolder = item.hash==="-";

                        if (item.isFolder){
                            currImages["f"+item.id] = item;
                            numItems++;
                            numAdditions++;
                        }
                        else{

                            var hash = item.hash;
                            if (!hash) hash = "";
                            var isDuplicate = false;
                            if (imageHashes[hash]){
                                isDuplicate = true;
                            }
                            else{
                                imageHashes[hash] = true;

                              //Compare hamming distance between the current
                              //image hash and all the other images
                                for (var key in currImages) {
                                    if (currImages.hasOwnProperty(key)){


                                      //Compute hamming distance
                                        if (key.length===hash.length){
                                            var d = 0;
                                            for (var k=0; k<key.length; k++) {
                                                if (key.charAt(k) !== hash.charAt(k)) {
                                                    d++;
                                                }
                                            }

                                            if (d<=config.similarityThreshold){
                                                isDuplicate = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }



                            if (!isDuplicate){
                                currImages[hash] = item;
                                numItems++;
                                numAdditions++;
                            }
                        }


                      //Break once we have enough items to satisfy the limit
                        if (numItems===limit){

//                          //Rewind page as needed
//                            if (numAdditions!=items.length){
//                                console.log("currPage--");
//                                //currPage--;
//                            }

                            break;
                        }
                    }



                    if (numItems===limit || items.length<limit){
                        if (items.length==0) eof = true;
                        //console.log(numItems, items.length, limit);

                        loading = false;

                        if (callback && callback.success){
                            callback.success.apply(me, [Object.values(currImages)]);
                        }
                    }
                    else{
                        getItems(page+1);
                    }
                },
                failure: function(request){
                    loading = false;

                    if (callback && callback.failure){
                        callback.failure.apply(me, [request]);
                    }
                }
            });

        };


        getItems(currPage);
    };


  //**************************************************************************
  //** isEOF
  //**************************************************************************
    this.isEOF = function(){
        return eof;
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var post = javaxt.dhtml.utils.post;

    init();
};