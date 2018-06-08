const {VDOM, patch} = require("./vdom")
const gensym = require("./gensym")
const nil_dom = require("./nil_dom")
const isGenerator = require("./generator/is")
const upGenerator = require("./generator/up")
const mapOut = require("./generator/mapOut");
const zip = require("./generator/zip");

let hArgs = (args) => {
    let tagName = args.shift()
    let attrs = {}
    if(typeof args[0] == 'object' && args[0].constructor === Object) {
        attrs = args.shift()
    }
    let children = [].concat.apply([], args.map(arg => Array.isArray(arg) ? arg : [arg]))
    return {tagName, attrs, children}
}

module.exports = function() {
    let {tagName, attrs, children} = hArgs([...arguments])
    if(children.some(isGenerator)) {
        return mapOut(ws => new VDOM(tagName, attrs, ws.filter(d => d !== nil_dom)))(zip(children.map(upGenerator)))
    } else {
        return new VDOM(tagName, attrs, children.filter(d => d !== nil_dom))
    }
}

module.exports.normalizeArguments = hArgs
