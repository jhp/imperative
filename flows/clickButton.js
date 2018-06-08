let button = require("./button")

module.exports = function* (markup, state) {
    while(true) {
        let eventState = yield* button(markup, state)
        if(eventState.event.type === 'click')
            return eventState
        else
            state = eventState.state
    }
}
