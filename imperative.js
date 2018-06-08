
const h = require("./h")
const run = require("./run")
const mapOut = require("./generator/mapOut")
const zip = require("./generator/zip")
const memo = require("./generator/memo")

const button = require("./flows/button")
const clickButton = require("./flows/clickButton")
const radio = require("./flows/radio")
const textInput = require("./flows/textInput")
const checkbox = require("./flows/checkbox")
const select = require("./flows/select")
const counter = require("./flows/counter")

const wait = require("./flows/wait")
const timeout = require("./flows/timeout")
const get = require("./flows/get")
const post = require("./flows/post")

const state = require("./state")


module.exports = {
    // core
    run: run,
    h: h,
    mapOut: mapOut,
    zip: zip,
    memo: memo,

    // flows
    button: button,
    clickButton: clickButton,
    radio: radio,
    textInput: textInput,
    checkbox: checkbox,
    select: select,
    counter: counter,
    wait: wait,
    timeout: timeout,
    get: get,
    post: post,

    state: state
}
