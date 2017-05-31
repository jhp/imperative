const I = require("./imperative")
const gensym = require("./gensym")

function* button(markup, state) {
  state = Object.assign({focus: false, hover: false}, state || {})
  return yield (resolve, reject) =>
    I.h('span', {
      attrs: {tabindex: 0},
      style: {cursor: 'pointer'},
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
      hook: {
        insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
        postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
      }
    }, [markup])
}

function* clickButton(text, styles, hoverStyles, state) {
  while(true) {
    const eventState = yield* button(I.h("span", {}, text), styles, state)
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
    I.h('span', {style: containerStyles},
        [].concat.apply([], options.map(
          (option, ii) => {
            let isFocused = state.focus && (option.value === state.value || ii === 0 && state.value === null)
            return (ii === 0 ? [] : [I.h('br')]).concat([I.h('label', {
              style: labelStyles,
              hook: {
                insert: (vnode) => isFocused ? vnode.elm.focus() : vnode.elm.blur(),
                postpatch: (old, vnode) => isFocused ? vnode.elm.focus() : vnode.elm.blur()
              }
            }, [
              I.h('input', {
                props: {type: 'radio', value: option, name: state.name, checked: state.value === option},
                on: {
                  change: (ev) =>
                    resolve({event: ev, state: Object.assign(state, {value: ev.target.value})}),
                  blur: (ev) =>
                    resolve({event: ev, state: Object.assign(state, {focus: false})}),
                  focus: (ev) =>
                    resolve({event: ev, state: Object.assign(state, {focus: true})}),
                },
              }, []),
              option])])})))
}

function* checkbox(text, styles, state) {
  state = Object.assign({focus: false, checked: false}, state || {})
  return yield (resolve, reject) =>
    I.h('label', {style: styles}, [
      I.h('input', {
        props: {type: 'checkbox', checked: state.checked},
        on: {
          change: (ev) =>
            resolve({event: ev, state: Object.assign(state, {checked: ev.target.checked})}),
          blur: (ev) =>
            resolve({event: ev, state: Object.assign(state, {focus: false})}),
          focus: (ev) =>
            resolve({event: ev, state: Object.assign(state, {focus: true})}),
        },
        hook: {
          insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
          postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
        }
      }, []),
      I.h('span', {}, text)])
}

function* textInput(placeholder, styles, state) {
  state = Object.assign({focus: false, value: ""}, state || {})
  return yield (resolve, reject) =>
    I.h('input', {
      props: {type: 'text', value: state.value, placeholder: placeholder},
      style: styles,
      on: {
        input: (ev) =>
          resolve({event: ev, state: Object.assign(state, {value: ev.target.value})}),
        blur: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: false})}),
        focus: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: true})}),
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
    I.h('select', {
      props: {value: state.value},
      style: styles,
      on: {
        change: (ev) =>
          resolve({event: ev, state: Object.assign(state, {value: ev.target.value})}),
        blur: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: false})}),
        focus: (ev) =>
          resolve({event: ev, state: Object.assign(state, {focus: true})}),
      },
      hook: {
        insert: (vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur(),
        postpatch: (old, vnode) => state.focus ? vnode.elm.focus() : vnode.elm.blur()
      }
    }, options.map(option => I.h('option', {props: {value: option}}, [option])))
}

module.exports = {
  button: button,
  clickButton: clickButton,
  radio: radio,
  textInput: textInput,
  checkbox: checkbox,
  select: select
}
