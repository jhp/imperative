let I = require("./imperative")
let Widgets = require("./widgets")

function* counter() {
  let state = {}
  let n = 0
  while(true) {
    state = (yield* Widgets.clickButton("Clicked " + n, {}, {}, state)).state
    n++
  }
}


module.exports = counter
