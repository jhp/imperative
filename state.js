const gensym = require("./gensym")
const nil_dom = require("./nil_dom")

const queuedStateUpdates = new Map()

const stateUpdateListeners = new WeakMap()

const stateValues = new WeakMap()

const queueStateUpdate = (() => {
  let queued = false
  const runStateUpdate = () => {
    while(queuedStateUpdates.size) {
      const nextEntry = queuedStateUpdates.entries().next().value
      if(stateUpdateListeners.has( nextEntry[0] )) {
        const listeners = stateUpdateListeners.get( nextEntry[0] )
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

const setState = (sym, value) => {
  queuedStateUpdates.set(sym, value)
  queueStateUpdate()
}

const getState = sym => stateValues.get(sym)

const watchState = function*(sym) {
  return yield (resolve, reject) => {
    if(!stateUpdateListeners.has(sym)) {
      stateUpdateListeners.set(sym, [])
    }
    stateUpdateListeners.get(sym).push(val => resolve(val))
    return nil_dom
  }
}

const makeState = (value) => {
  const sym = gensym()
  stateValues.set(sym, value)
  return sym
}
  
module.exports = {
  set: setState,
  get: getState,
  watch: watchState,
  make: makeState
}
