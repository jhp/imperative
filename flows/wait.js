const nil_dom = require("../nil_dom")
module.exports = function* () { return yield () => nil_dom }
