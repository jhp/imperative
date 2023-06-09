async function run(main, container=document.body) {
    let cleanup = [], output = {v: null};
    while(true) {
        let value, done;
        ({value, done} = ('v' in output) ? main.next(output.v) : main.throw(output.e)); 
        if(done) {
            await Promise.all(cleanup.slice(0).reverse().map(k => k()));
            console.log("Completed with value", value);
            return value;
        }
        try {
            output = {v: await value({
                H: (felem) => { 
                    elem = felem( container, () => {
                        container.removeChild(elem);
                    });
                    if(elem) {
                        container.appendChild(elem); 
                    } 
                }, 
                cleanup: (k) => cleanup.push(k)
            })};
        } catch(e) {
            output = {e};
        }
        await Promise.all(cleanup.slice(0).reverse().map(k => k()));
        cleanup = [];
    }
    
}

function never() {
    return new Promise(resolve => {});
}

function* T(str) {
    yield ({H, cleanup}) => {
        H((_,remover) => { cleanup(remover); return document.createTextNode(str) });
        return never();
    };
}

function* A(name, val) {
    yield ({H, cleanup}) => {
        H((elem) => {
            elem[ name ] = val;
            cleanup(() => { elem[ name ] = null; });
        });
        return never();
    };
}

function* globalStyle(css) {
    yield ({cleanup}) => {
        let ss = document.createElement("style");
        document.head.appendChild(ss);
        ss.innerText = css;
        cleanup(() => document.head.removeChild(ss));
        return never();
    }
}

function* S(name, val) {
    let obj = typeof name === 'object' ? name : {[name]: val};
    yield ({H, cleanup}) => {
        H((elem) => {
            for(let [name, val] of Object.entries(obj)) {
                elem.style[ name ] = val;
            }
            cleanup(() => {
                for(let [name, val] of Object.entries(obj)) {
                    elem.style[ name ] = null;
                }
            });
        });
        return never();
    };
}

function* E(name) {
    return yield ({H, cleanup}) => new Promise(resolve => {
        H((elem) => {
            let fn = (ev) => resolve(ev);
            elem.addEventListener(name, fn);
            cleanup(() => { elem.removeEventListener( name, fn ) });
        });
    });
}

function* H(name, ...children) {
    children = children.flat(1).map(child => typeof child === 'string' ? function*() { yield* T(child) } : child);
    let childElems = children.map(() => []);
    let parentElem = document.createElement(name);
    return yield* multi(
        function*() {
            yield ({H, cleanup}) => {
                H((_,remover) => { cleanup(remover); return parentElem });
                return never();
            }
        },
        children.map((child, ii) =>
            local(({H, ...args}) => ({
                H: (fel) => {
                    let el = fel(parentElem, () => {
                        childElems[ii] = childElems[ii].filter(cel => cel !== el);
                        parentElem.removeChild(el);
                    });
                    if(el) {
                        let nextChild = childElems.slice(ii+1).flat().find(Boolean);
                        if(nextChild) parentElem.insertBefore(el, nextChild);
                        else parentElem.appendChild(el);
                        childElems[ii].push(el);
                    }
                },
                ...args
            }), child)
        )
    );
}

function toGen(gen) {
    if(typeof gen === 'string') return T(gen);
    return gen.next ? gen : gen();
}

function* local(fn, ...gens) {
    gens = gens.flat(1).map(toGen);
    const gen = gens.length === 1 ? gens[0] : multi(gens);
    let output = {v: null};
    while(true) {
        let {value, done} = ('v' in output) ? gen.next(output.v) : gen.throw(output.e);
        if(done) return value;
        try {
            output = {v: yield (args) => value(fn(args))};
        } catch(e) {
            output = {e};
        }
    }
}

function* multi(...gens) {
    gens = gens.flat(1).map(toGen);
    let cleanups = gens.map(() => []);
    return yield (args) => {
        return new Promise((resolve, reject) => {
            let resolved = false;
            args.cleanup(() => {
                resolved = true;
                cleanups.flat(1).reverse().map(k => k())
            });
            gens.map(async (gen, ii) => {
                let output = {v: null};
                while(true) {
                    if(resolved) {
                        return;
                    }
                    let value, done;
                    try {
                        ({value, done} = ('v' in output) ? gen.next(output.v) : gen.throw(output.e));
                    } catch(e) {
                        if(!resolved) {
                            resolved = true;
                            reject(e);
                        }
                        return;
                    }
                    if(done) {
                        if(!resolved) {
                            resolved = true;
                            resolve(value);
                        }
                        return;
                    }
                    try {
                        output = {v: await value({...args, cleanup: (k) => cleanups[ii].push(k)})};
                    } catch(e) {
                        output = {e};
                    }
                    await Promise.all(cleanups[ii].slice(0).reverse().map(k => k()));
                    cleanups[ii] = [];
                }
            });
        });
    }
}

function AsyncVar(init) {
    let value = init;
    const listeners = new Set();
    return {
        get: () => value,
        next: function(cleanup) {
            return new Promise(resolve => {
                listeners.add(resolve);
                cleanup(() => {
                    listeners.delete(resolve)
                });
            });
        },
        set: (v) => {
            value = v;
            listeners.forEach(cb => cb(value));
        }
    }
}

function wrapAsyncVar(asyncVar) {
    return {
        get: asyncVar.get,
        next: function*() {
            return yield ({cleanup}) => asyncVar.next(cleanup);
        },
        set: asyncVar.set,
        fmap: function*(fn) {
            let self = this;
            while(true) {
                let res = yield* multi(function*() { yield* self.next(); return null; }, function*() { return [yield* fn(self.get())] });
                if(res) return res[0];
            }
        }
    }
}

function Var(init) {
    return wrapAsyncVar( AsyncVar(init) );
}

function* openPortal(fn) {
    let portalArgs;
    let resolvePortal;
    let portalReady = new Promise(resolve => { resolvePortal = resolve; });
    return yield* fn(
        function* () { yield ({cleanup, ...args}) => { portalArgs = args; resolvePortal(); return new Promise(resolve => {}) } },
        function* (portalChild) { yield () => portalReady; return yield* local(({cleanup, ...args}) => ({cleanup, ...portalArgs}), portalChild); });
}

function* Fetch(url, opts={}) {
    return yield ({cleanup}) => {
        let ac = new AbortController();
        cleanup(() => ac.abort());
        return fetch(url, {...opts, signal: ac.signal}).then(fetchResult => {
            let json = fetchResult.json.bind(fetchResult);
            let text = fetchResult.text.bind(fetchResult);
            fetchResult.json = function*() { yield () => json() };
            fetchResult.text = function*() { yield () => text() };
            return fetchResult;
        });
    }
}

function* wait(n) {
    yield () => new Promise(resolve => setTimeout(resolve, n));
}

function* waitFrame(n) {
    yield () => new Promise(resolve => requestAnimationFrame(resolve));
}

module.exports = { run, multi, local, H, A, S, T, E, globalStyle, Var, openPortal, never, Fetch, wait, waitFrame };
