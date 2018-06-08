module.exports = function(wfn) {
    let flows = new Map()
    let outputs = new Map()
    return (x) => {
        if(!flows.has(x)) {
            flows.set(x, wfn(x))
        }
        return function*() {
            let arg;
            if(outputs.has(x)) {
                arg = yield outputs.get(x)
            }
            while(true) {
                let o = flows.get(x).next(arg)
                if(o.done) {
                    flows.delete(x)
                    outputs.delete(x)
                    return o.value
                } else {
                    outputs.set(x, o.value)
                    arg = yield o.value
                }
            }
        }()
    }
}
