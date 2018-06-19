const promise = require("./promise")
module.exports = (n) => promise(new Promise(resolve => setTimeout(resolve, n)))
