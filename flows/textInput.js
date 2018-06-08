const h = require("../h")

module.exports = function* (placeholder, styles, state, type='text') {
    state = Object.assign({focus: false, value: ""}, state || {})
    function getSelection(node) {
        return [node.selectionStart, node.selectionEnd]
    }
    return yield (resolve, reject) =>
        h('input', {
            type: type,
            value: state.value,
            placeholder: placeholder,
            style: styles,
            onmouseup: (ev) => {
                ev.stopPropagation(),
                resolve({event: ev, state: Object.assign({}, state, {selection: getSelection(ev.target)})})
            },
            onkeyup: (ev) => {
                ev.stopPropagation(),
                resolve({event: ev, state: Object.assign({}, state, {selection: getSelection(ev.target)})})
            },
            oninput: (ev) => {
                ev.stopPropagation()
                resolve({event: ev, state: Object.assign({}, state, {value: ev.target.value, selection: getSelection(ev.target)})})
            },
            onblur: (ev) => {
                ev.stopPropagation()
                if(state.focus)
                    resolve({event: ev, state: Object.assign({}, state, {focus: false, selection: getSelection(ev.target)})})
            },
            onfocus: (ev) => {
                ev.stopPropagation()
                if(!state.focus)
                    resolve({event: ev, state: Object.assign({}, state, {focus: true, selection: getSelection(ev.target)})})
            },
            focus: state.focus,
            selection: state.selection
        }, [])
}
