const nil_dom = require("../nil_dom")
module.exports = function* (url) {
    return yield finish => {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function() {
            finish(xhr.responseText)
        });
        xhr.open("GET", url);
        xhr.send();
        return nil_dom
    }
}
