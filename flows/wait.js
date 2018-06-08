const nil_dom = require("../nil_dom")
module.exports = function* () { return yield finish => nil_dom }
function* wait() {
  return yield finish => nil_dom
}
