const genysm = require("./gensym")
const nil_dom = require("./nil_dom")
const snabbdom = require("snabbdom")
const patch = snabbdom.init([
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/style').default,
  require('snabbdom/modules/eventlisteners').default
])
const hDom = require('snabbdom/h').default

const mapOut = fn => function* (w) {
  let arg = undefined
  while(true) {
    const o = w.next(arg)
    if(o.done) {
      return o.value
    }
    arg = yield (resolve, reject, isDone) => fn(o.value(resolve, reject, isDone))
  }
}
      
const zip = function* (ws) {
  let os = ws.map(w => w.next())
  while(true) {
    for(const o of os) {
      if(o.done) {
        return o.value
      }
    }
    yield (parentResolve, parentReject, isDone) => {
      return os.map((o, ii) => 
                    o.value(
                      z => { if(!isDone()) { os[ii] = ws[ii].next(z); parentResolve() } },
                      e => { if(!isDone()) { os[ii] = ws[ii].throw(e); parentResolve() } },
                      isDone))
    }
  }
}
  
function* constGenerator(w) {
  return yield w
}

const isGenerator = w => !!(w.next && w.throw)

const upGenerator = w => isGenerator(w) ? w : constGenerator((resolve, reject, isDone) => w)

const run = (w, elem) => {
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
    if(o.done)
      console.log("Top-level widget finished", o.value)
    else
      vnode = patch(vnode || elem, o.value(
        z => { if(!done) { done = true; next(z) } },
        e => { if(!done) { done = true; next(undefined, e) } },
        () => done
      ))
  }
}

const h = function() {
  const args = [...arguments]
  const finalArgs = []
  while(args.length && !Array.isArray(args[0])) {
    finalArgs.push(args.shift())
  }
  if(!args.length) {
    return hDom.apply(this, arguments)
  }
  if(args[0].some(isGenerator)) {
    return mapOut(ws => hDom.apply(this, finalArgs.concat([ws.filter(d => d != nil_dom)])))(zip(args[0].map(upGenerator)))
  } else {
    return hDom.apply(this, finalArgs.concat(args[0]))
  }
}


module.exports = {
  run: run,
  h: h,
  mapOut: mapOut,
  zip: zip
}
