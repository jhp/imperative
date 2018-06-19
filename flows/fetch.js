const promise = require("./promise")

module.exports = function(...args) {
    return promise(fetch(...args))
}
