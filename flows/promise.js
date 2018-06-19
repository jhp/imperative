const nil_dom = require("../nil_dom")
module.exports = function* (promise) {
    let _resolve, _reject, init = 1
    return yield (resolve, reject) => {
        _resolve = resolve
        _reject = reject
        if(init--) promise.then(result => _resolve(result), err => _reject(err))
        return nil_dom
    }
}
