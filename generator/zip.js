module.exports = function* (ws) {
    let os = ws.map(w => w.next())
    while(true) {
        for(let o of os) {
            if(o.done) {
                return o.value
            }
        }
        yield (parentResolve, parentReject, isDone) => {
            return os.map((o, ii) =>
                          o.value(
                              z => { if(!isDone()) { os[ii] = ws[ii].next(z); parentResolve() } },
                              e => { if(!isDone()) { os[ii] = ws[ii].throw(e); parentResolve() } },
                              isDone))
        }
    }
}
