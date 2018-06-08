module.exports = fn => function* (w) {
    let arg = undefined
    while(true) {
        let o = w.next(arg)
        if(o.done) {
            return o.value
        }
        arg = yield (resolve, reject, isDone) => fn(o.value(resolve, reject, isDone))
    }
}
