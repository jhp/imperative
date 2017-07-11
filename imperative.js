function VDOM(tagName, attrs, children) { this.tagName = tagName; this.attrs = attrs; this.children = children }
let hArgs = (args) => {
  let tagName = args.shift()
  let attrs = {}
  if(typeof args[0] == 'object' && !Array.isArray(args[0]) && !(args[0] instanceof VDOM)) {
    attrs = args.shift()
  }
  let children = [].concat.apply([], args.map(arg => Array.isArray(arg) ? arg : [arg]))
  return {tagName, attrs, children}
}

let vdomMap = new WeakMap()

function patch(vdom, node) {
  if(!vdomMap.has(node) || typeof vdom === "string") {
    let [focusNode, vdomNode] = create(vdom)
    if(focusNode) focusNode.focus()
    node.parentNode.replaceChild(vdomNode, node)
    return vdomNode
  }

  let old = vdomMap.get(node)
  if(old === vdom) return node
  
  if(old.tagName !== vdom.tagName || vdom.attrs.oncreate) {
    let [focusNode, vdomNode] = create(vdom)
    if(focusNode) focusNode.focus()
    node.parentNode.replaceChild(vdomNode, node)
    return vdomNode
  }

  vdomMap.set(node, vdom)
  // reconcile attrs and styles
  for(let key of new Set(Object.keys(old.attrs).concat(Object.keys(vdom.attrs)))) {
    if(key === 'focus') continue
    if(key === 'style') {
      for(let styleKey of new Set(Object.keys(old.attrs.style || {}).concat(Object.keys(vdom.attrs.style || {})))) {
        let oldStyle = (old.attrs.style || {})[styleKey]
        let newStyle = (vdom.attrs.style || {})[styleKey]
        if(oldStyle !== newStyle) {
          node.style[ styleKey ] = newStyle
        }
      }
    } else {
      if(vdom.attrs[key] !== old.attrs[key]) {
        node[key] = vdom.attrs[key]
      }
    }
  }
  if(vdom.attrs.focus && node !== document.activeElement)
    node.focus()
  if(!vdom.attrs.focus && node === document.activeElement)
    node.blur()
  // reconcile children - a simple algorithm with no attempt to keep track of shuffled lists
  let nodeChild = node.firstChild
  for(let child of vdom.children) {
    while(nodeChild && nodeChild.nodeType !== 1) {
      let next = nodeChild.nextSibling
      node.removeChild(nodeChild)
      nodeChild = next
    }
    if(nodeChild) {
      let next = nodeChild.nextSibling
      patch(child, nodeChild)
      nodeChild = next
    } else {
      let [childFocus, childNode] = create(child)
      node.appendChild(childNode)
      if(childFocus) childFocus.focus()
    }
  }
  if(nodeChild) {
    while(nodeChild.nextSibling) {
      node.removeChild(nodeChild.nextSibling)
    }
    node.removeChild(nodeChild)
  }
  return node
  function create(vdom) {
    if(typeof vdom === "string") return [null, document.createTextNode(vdom)]

    let node = document.createElement(vdom.tagName)
    vdomMap.set(node, vdom)
    for(let key of Object.keys(vdom.attrs)) {
      if(key === 'focus' || key === 'oncreate') continue
      if(key === 'style') {
        for(let styleKey of Object.keys(vdom.attrs.style)) {
          node.style[ styleKey ] = vdom.attrs.style[ styleKey ]
        }
      } else {
        node[ key ] = vdom.attrs[ key ]
      }
    }
    let focusNode = null
    for(let child of vdom.children) {
      let [childFocus, childNode] = create(child)
      node.appendChild(childNode)
      focusNode = focusNode || childFocus
    }
    if(vdom.attrs['focus']) {
      focusNode = node
    }
    if(vdom.attrs.oncreate) {
      vdom.attrs.oncreate(node)
    }
    return [focusNode, node]
  }
}

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
        nextVNode = h('span')
      }
      elem = patch(nextVNode, elem)
    }
  }
}

let h = function() {
  let {tagName, attrs, children} = hArgs([...arguments])
  if(children.some(isGenerator)) {
    return mapOut(ws => new VDOM(tagName, attrs, ws.filter(d => d !== nil_dom)))(zip(children.map(upGenerator)))
  } else {
    return new VDOM(tagName, attrs, children)
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
      onmouseenter: (ev) => {
        ev.stopPropagation()
        resolve({event: ev, state: Object.assign(state, {hover: true})})
      },
      onmouseleave: (ev) => {
        ev.stopPropagation()
        resolve({event: ev, state: Object.assign(state, {hover: false})})
      },
      onclick: (ev) => {
        ev.stopPropagation()
        resolve({event: ev, state: state})
      },
      onblur: (ev) => {
        ev.stopPropagation()
        if(state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: false})})
      },
      onfocus: (ev) => {
        ev.stopPropagation();
        if(!state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: true})})
      },
      focus: state.focus
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
                type: 'radio',
                value: option,
                name: state.name,
                checked: state.value === option,
                onchange: (ev) => {
                  ev.stopPropagation()
                  resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
                },
                onblur: (ev) => {
                  ev.stopPropagation()
                  if(state.focus)
                    resolve({event: ev, state: Object.assign({}, state, {focus: false})})
                },
                onfocus: (ev) => {
                  ev.stopPropagation()
                  if(!state.focus)
                    resolve({event: ev, state: Object.assign({}, state, {focus: true})})
                }
              }, []),
              option])]})))
}

function* checkbox(text, styles, state) {
  state = Object.assign({focus: false, checked: false}, state || {})
  return yield (resolve, reject) =>
    h('label', {style: styles}, [
      h('input', {
        type: 'checkbox',
        checked: state.checked,
        onchange: (ev) => {
          ev.stopPropagation()
          resolve({event: ev, state: Object.assign(state, {checked: ev.target.checked})})
        },
        onblur: (ev) => {
          ev.stopPropagation()
          if(state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: false})})
        },
        onfocus: (ev) => {
          ev.stopPropagation()
          if(!state.focus)
            resolve({event: ev, state: Object.assign({}, state, {focus: true})})
        },
        focus: state.focus
      }, []),
      h('span', {}, text)])
}

function* textInput(placeholder, styles, state) {
  state = Object.assign({focus: false, value: ""}, state || {})
  return yield (resolve, reject) =>
    h('input', {
      props: {type: 'text', value: state.value, placeholder: placeholder},
      style: styles,
      oninput: (ev) => {
        ev.stopPropagation()
        resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
      },
      onblur: (ev) => {
        ev.stopPropagation()
        if(state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: false})})
      },
      onfocus: (ev) => {
        ev.stopPropagation()
        if(!state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: true})})
      },
      focus: state.focus
    }, [])
}

function* select(options, styles, state) {
  state = Object.assign({focus: false, value: null}, state || {})
  return yield (resolve, reject) =>
    h('select', {
      value: state.value,
      style: styles,
      onchange: (ev) => {
        ev.stopPropagation()
        resolve({event: ev, state: Object.assign(state, {value: ev.target.value})})
      },
      onblur: (ev) => {
        ev.stopPropagation()
        if(state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: false})})
      },
      onfocus: (ev) => {
        ev.stopPropagation()
        if(!state.focus)
          resolve({event: ev, state: Object.assign({}, state, {focus: true})})
      },
      focus: state.focus
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
