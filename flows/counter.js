const clickButton = require("./clickButton")

module.exports = function* () {
    let state = {}
    let n = 0
    while(true) {
        state = (yield* clickButton("Clicked " + n, {}, {}, state)).state
        n++
    }
}
