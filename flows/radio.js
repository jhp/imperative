const h = require("../h")

module.exports = function* (options, containerStyles, labelStyles, state) {
    let name = state.name || "radio-" + gensym().gensym
    state = Object.assign({focus: false, value: null, name: name}, state || {})
    return yield (resolve, reject) =>
        h('span', {style: containerStyles},
          [].concat.apply([], options.map(
              (option, ii) => {
                  let isFocused = state.focus && (option.value === state.value || ii === 0 && state.value === null)
                  return [h('label', {
                      style: labelStyles,
                      focus: isFocused
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
