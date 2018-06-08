const nil_dom = require("./nil_dom")
const gensym = require("./gensym")

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

module.exports = {
    set: setState,
    get: getState,
    watch: watchState,
    make: makeState
}
