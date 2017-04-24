const genysm = require("./gensym")
const nil_dom = require("./nil_dom")
const snabbdom = require("snabbdom")
const patch = snabbdom.init([
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/style').default,
  require('snabbdom/modules/eventlisteners').default
])
const hDom = require('snabbdom/h').default
const state = require("./state")

const mapOut = fn => function* (w) {
  let arg = undefined
  while(true) {
    const o = w.next(arg)
    if(o.done) return o.value
    arg = yield (resolve, reject) => fn(o.value(resolve, reject))
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
    yield (parentResolve, parentReject) => {
      let done = false
      return os.map((o, ii) => {
        const resolve = z => {
          if(done) return
          done = true
          os[ii] = ws[ii].next(z)
          parentResolve()
        }
        const reject = z => {
          if(done) return
          done = true
          os[ii] = ws[ii].throw(z)
          parentResolve()
        }
        return o.value(resolve, reject)})
    }
  }
}

function* constGenerator(w) {
  return yield w
}

const isGenerator = w => !!(w.next && w.throw)

const upGenerator = w => isGenerator(w) ? w : constGenerator((resolve, reject) => w)

const run = w => {
  let vnode = undefined
  next()
  function next(z, err) {
    if(err) {
      o = w.throw(err)
    } else {
      o = w.next(z)
    }
    console.log(o)
    if(o.done)
      console.log(o.value)
    else
      vnode = patch(vnode || document.body, o.value(next, (e) => { next(undefined, e) }, fn => {}))
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


const Button = function*(str) {
  return yield (resolve,reject) => h('button', {props: {type: 'text'}, on: {click: () => resolve()}}, str)
}

const Input = function*(str) {
  return yield (resolve,reject) => h('input', {props: {type: 'text', value: str}, on: {change: e => resolve(e.target.value)}})
}

module.exports = {
  run: run,
  h: h,
  mapOut: mapOut,
  zip: zip
}
