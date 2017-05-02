const I = require("./imperative");

function* button(text, styles, state) {
  state = Object.assign({focus: false, hover: false}, state || {})
  return yield (resolve, reject) => 
    I.h('button', {
      style: styles,
      on: {
        mouseenter: (ev) =>
          resolve({event: ev, state: Object.assign(state, {hover: true})}),
        mouseleave: (ev) =>
          resolve({event: ev, state: Object.assign(state, {hover: false})}),
        click: (ev) =>
          resolve({event: ev, state: state}),
        blur: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: false})}),
        focus: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: true})}),
      },
      hooks: {postpatch:
        (oldVnode, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()}
    }, [text])
}

function* radio(options, styles, state) {
}

function* checkbox(text, styles, state) {
}

function* textInput(styles, state) {
  state = Object.assign({focus: false, value: ""}, state || {})
  return yield (resolve, reject) => 
    I.h('input', {
      props: {type: 'text', value: state.value},
      style: styles,
      on: {
        input: (ev) =>
          resolve({event: ev, state: Object.assign(state, {value: ev.target.value})}),
        blur: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: false})}),
        focus: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: true})}),
      },
      hooks: {postpatch:
        (oldVnode, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()}
    }, [])
}

function* select(options, styles, state) {
}

module.exports = {
  button: button,
  radio: radio,
  textInput: textInput,
  checkbox: checkbox,
  select: select
}
