const nil_dom = require("../nil_dom")

module.exports = function* (url, payload) {
    return yield finish => {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function() {
            finish(xhr.responseText);
        });
        xhr.open("POST", url);
        xhr.send(payload);
        return nil_dom
    }
}
