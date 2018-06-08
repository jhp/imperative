const h = require("../h")

module.exports = function* (text, styles, state) {
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
