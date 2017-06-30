let snabbdom = require("snabbdom")
let patch = snabbdom.init([
  require('snabbdom/modules/attributes').default,
  require('snabbdom/modules/class').default,
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/style').default,
  require('snabbdom/modules/eventlisteners').default
])
let hDom = require('snabbdom/h').default

let gensym = function() {
  let n = 1
  // n is just used for debugging; really we use the object identity as a unique key for maps
  return () => ({gensym: n++})
}()

let nil_dom = gensym()

let mapOut = fn => function* (w) {
  let arg = undefined
  while(true) {
    let o = w.next(arg)
    if(o.done) {
      return o.value
    }
    arg = yield (resolve, reject, isDone) => fn(o.value(resolve, reject, isDone))
  }
}

function memo(wfn) {
  let widgets = new Map()
  let outputs = new Map()
  return (x) => {
    if(!widgets.has(x)) {
      widgets.set(x, wfn(x))
    }
    return function*() {
      let arg;
      if(outputs.has(x)) {
        arg = yield outputs.get(x)
      }
      while(true) {
        let o = widgets.get(x).next(arg)
        if(o.done) {
          widgets.delete(x)
          outputs.delete(x)
          return o.value
        } else {
          outputs.set(x, o.value)
          arg = yield o.value
        }
      }
    }()
  }
}

let zip = function* (ws) {
  let os = ws.map(w => w.next())
  while(true) {
    for(let o of os) {
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

let isGenerator = w => !!(w.next && w.throw)

let upGenerator = w => isGenerator(w) ? w : constGenerator((resolve, reject, isDone) => w)

let run = (w, elem) => {
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
      console.log("Top-level widget finished", o.value)
    } else {
      let nextVNode = o.value(
        z => { if(!done) { done = true; next(z) } },
        e => { if(!done) { done = true; next(undefined, e) } },
        () => done)
      if(nextVNode === nil_dom) {
        nextVNode = () => h('span')
      }
      vnode = patch(vnode || elem, nextVNode())
    }
  }
}

let h = function() {
  let args = [...arguments]
  let finalArgs = []
  while(args.length && !Array.isArray(args[0])) {
    finalArgs.push(args.shift())
  }
  if(!args.length) {
    return () => hDom.apply(this, arguments)
  }
  if(args[0].some(isGenerator)) {
    return mapOut(ws => () => hDom.apply(this, finalArgs.concat([ws.filter(d => d !== nil_dom).map(d => d.call ? d() : d)])))(zip(args[0].map(upGenerator)))
  } else {
    return () => hDom.apply(this, finalArgs.concat([args[0].map(d => d.call ? d() : d)]))
  }
}

/*
 * Widgets
 */

function* button(markup, state) {
  state = Object.assign({focus: false, hover: false}, state || {})
  return yield (resolve, reject) =>
    h('span', {
      attrs: {tabindex: 0},
      style: {cursor: 'pointer'},
      on: {
        mouseenter: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: Object.assign(state, {hover: true})})
        },
        mouseleave: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: Object.assign(state, {hover: false})})
        },
        click: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: state})
        },
        blur: (ev) => {
          ev.stopPropagation()
          if(state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: false})})
        },
        focus: (ev) => {
          ev.stopPropagation();
          if(!state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: true})})
        }
      },
      hook: {
        insert: (vnode) => state.focus ? (vnode.elm !== document.activeElement) && vnode.elm.focus() : (vnode.elm === document.activeElement) && vnode.elm.blur(),
        postpatch: (old, vnode) => state.focus ? (vnode.elm !== document.activeElement) && vnode.elm.focus() : (vnode.elm === document.activeElement) && vnode.elm.blur()
      }
    }, [markup])
}

function* clickButton(text, styles, state) {
  styles = Object.assign({
    border: '1px solid #bbb',
    borderRadius: '6px',
    padding: '1px 8px',
    boxShadow: ''
  }, styles || {})
  state = state || {}
  while(true) {
    let eventState = yield* button(h("span", {style: styles}, text), state)
    if(eventState.event.type === 'click')
      return eventState
    else
      state = eventState.state
  }
}

function* radio(options, containerStyles, labelStyles, state) {
  let name = state.name || "radio-" + gensym().gensym
  state = Object.assign({focus: false, value: null, name: name}, state || {})
  return yield (resolve, reject) =>
    h('span', {style: containerStyles},
        [].concat.apply([], options.map(
          (option, ii) => {
            let isFocused = state.focus && (option.value === state.value || ii === 0 && state.value === null)
            return [h('label', {
              style: labelStyles,
              hook: {
                insert: (vnode) => isFocused ? vnode.elm.focus() : vnode.elm.blur(),
                postpatch: (old, vnode) => isFocused ? vnode.elm.focus() : vnode.elm.blur()
              }
            }, [
              h('input', {
                props: {type: 'radio', value: option, name: state.name, checked: state.value === option},
                on: {
                  change: (ev) => {
                    ev.stopPropagation()
                    resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
                  },
                  blur: (ev) => {
                    ev.stopPropagation()
                    if(state.focus)
                      resolve({event: ev, state: Object.assign({}, state, {focus: false})})
                  },
                  focus: (ev) => {
                    ev.stopPropagation()
                    if(!state.focus)
                      resolve({event: ev, state: Object.assign({}, state, {focus: true})})
                  }
                },
              }, []),
              option])]})))
}

function* checkbox(text, styles, state) {
  state = Object.assign({focus: false, checked: false}, state || {})
  return yield (resolve, reject) =>
    h('label', {style: styles}, [
      h('input', {
        props: {type: 'checkbox', checked: state.checked},
        on: {
          change: (ev) => {
            ev.stopPropagation()
            resolve({event: ev, state: Object.assign(state, {checked: ev.target.checked})})
          },
          blur: (ev) => {
            ev.stopPropagation()
            if(state.focus)
              resolve({event: ev, state: Object.assign({}, state, {focus: false})})
          },
          focus: (ev) => {
            ev.stopPropagation()
            if(!state.focus)
              resolve({event: ev, state: Object.assign({}, state, {focus: true})})
          }
        },
        hook: {
          insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
          postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
        }
      }, []),
      h('span', {}, text)])
}

function* textInput(placeholder, styles, state) {
  state = Object.assign({focus: false, value: ""}, state || {})
  return yield (resolve, reject) =>
    h('input', {
      props: {type: 'text', value: state.value, placeholder: placeholder},
      style: styles,
      on: {
        input: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
        },
        blur: (ev) => {
          ev.stopPropagation()
          if(state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: false})})
        },
        focus: (ev) => {
          ev.stopPropagation()
          if(!state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: true})})
        }
      },
      hook: {
        insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
        postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
      }
    }, [])
}

function* select(options, styles, state) {
  state = Object.assign({focus: false, value: null}, state || {})
  return yield (resolve, reject) =>
    h('select', {
      props: {value: state.value},
      style: styles,
      on: {
        change: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
        },
        blur: (ev) => {
          ev.stopPropagation()
          if(state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: false})})
        },
        focus: (ev) => {
          ev.stopPropagation()
          if(!state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: true})})
        }
      },
      hook: {
        insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
        postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
      }
    }, options.map(option => h('option', {props: {value: option}}, [option])))
}

function* wait() {
  return yield finish => nil_dom
}

function* timeout(n) {
  return yield finish => setTimeout(() => finish(), n)
}

function* get(url) {
  return yield finish => {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function() {
      finish(xhr.responseText)
    });
    xhr.open("GET", url);
    xhr.send();
    return nil_dom
  }
}

function* post(url, payload) {
  return yield finish => {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function() {
      finish(xhr.responseText);
    });
    xhr.open("POST", url);
    xhr.send(payload);
    return nil_dom
  }
}
/*
 * State
 */

let queuedStateUpdates = new Map()

let stateUpdateListeners = new WeakMap()

let stateValues = new WeakMap()

let queueStateUpdate = (() => {
  let queued = false
  let runStateUpdate = () => {
    while(queuedStateUpdates.size) {
      let nextEntry = queuedStateUpdates.entries().next().value
      if(stateUpdateListeners.has( nextEntry[0] )) {
        let listeners = stateUpdateListeners.get( nextEntry[0] )
        stateUpdateListeners.delete( nextEntry[0] )
        stateValues.set(nextEntry[0], nextEntry[1])
        listeners.map(listener => listener(nextEntry[1]))
      }
      queuedStateUpdates.delete(nextEntry[0])
    }
    queued = false
  }
  return () => {
    if(!queued) {
      queued = true
      setTimeout(runStateUpdate, 0)
    }
  }
})()

let setState = (sym, value) => {
  queuedStateUpdates.set(sym, value)
  queueStateUpdate()
}

let getState = sym => queuedStateUpdates.has(sym) ? queuedStateUpdates.get(sym) : stateValues.get(sym)

let watchState = function*(sym) {
  return yield (resolve, reject) => {
    if(!stateUpdateListeners.has(sym)) {
      stateUpdateListeners.set(sym, [])
    }
    stateUpdateListeners.get(sym).push(val => resolve(val))
    return nil_dom
  }
}

let makeState = (value) => {
  let sym = gensym()
  stateValues.set(sym, value)
  return sym
}

function* counter() {
  let state = {}
  let n = 0
  while(true) {
    state = (yield* Widgets.clickButton("Clicked " + n, {}, {}, state)).state
    n++
  }
}

module.exports = {
  // core
  run: run,
  h: h,
  mapOut: mapOut,
  zip: zip,
  memo: memo,

  // widgets
  button: button,
  clickButton: clickButton,
  radio: radio,
  textInput: textInput,
  checkbox: checkbox,
  select: select,

  // util
  wait: wait,
  timeout: timeout,
  get: get,
  post: post,

  state: {
    set: setState,
    get: getState,
    watch: watchState,
    make: makeState
  },

  counter: counter
}
