const {patch} = require("./vdom")
const nil_dom = require("./nil_dom")
const h = require("./h")

module.exports = (w, elem) => {
    let vnode = undefined
    next()
    function next(z, err) {
        let done = false
        let o
        if(err) {
            o = w.throw(err)
        } else {
            o = w.next(z)
        }
        if(o.done) {
            console.log("Top-level flow finished", o.value)
        } else {
            let vnode = o.value(
                z => { if(!done) { done = true; next(z) } },
                e => { if(!done) { done = true; next(undefined, e) } },
                () => done)
            if(vnode === nil_dom) {
                vnode = h('span')
            }
            elem = patch(vnode, elem)
            document.body.onmousemove = function(ev) {
                vnode.body.map(ob => ob.onmousemove && ob.onmousemove(ev))
            }
            document.body.onmouseup = function(ev) {
                vnode.body.map(ob => ob.onmouseup && ob.onmouseup(ev))
            }
        }
    }
}
