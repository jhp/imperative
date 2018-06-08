const h = require("../h")

module.exports = function* (markup, state) {
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
