javaxt.media.webapp.FileAdmin = function (parent, config) {

    var me = this;
    var init = function () {
        var div = createElement("div", parent, {

        });
        me.el = div;
    };

    var createElement = javaxt.dhtml.utils.createElement;
    init();
};