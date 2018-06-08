let mapOut = require("./mapOut")
module.exports = function* (w) {
    let last = null
    let result = yield* mapOut(o => { last = o; return o })(w)
    return {result, last}
}
