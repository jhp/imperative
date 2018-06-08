const nil_dom = require("../nil_dom")
module.exports = function* (n) {
    let timer, _finish;
    return yield finish => {
        _finish = finish;
        if(!timer) timer = setTimeout(() => _finish(), n)
        return nil_dom
    }
}
