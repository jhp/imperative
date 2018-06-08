const h = require("../h")

module.exports = function* (options, styles, state) {
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
        }, options.map(option => h('option', {value: option}, [option])))
}
