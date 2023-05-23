Imperative: Stateful Components 20x smaller than React with no VDOM
===================================================================

Imperative.js uses javascript generators to reproduce the advantages of React -
reusable, stateful components - without the complexity or code size. It is an
almost trivial library of only 1.5kb (minified + gzipped) but no less general
than React, and actually more ergonomic in some cases, such as waiting for a
fetch call.

An imperative component is an ordinary javascript generator. It can be run by
calling `run`. The optional second argument to run will set the root of the
application (defaults to `document.body`):

~~~{.javascript}
let { run } = require("imperative");
run(function*() { yield* H('div', "Hello, world"); });
~~~

Instead of JSX, Imperative uses ordinary javascript functions. These can be
easily remembered with the mnemonic `HASTE`. `H - HTML element`, `A - Attribute`, 
`S - Style`, `T - text`, `E - events`.

~~~{.javascript}
function* example() {
    // the first argument to H is an element name, after that pass 
    // any number of components or arrays of components.
    yield* H('div',
        // all the HASTE functions return components. This one will set a style
        // on the parent div.
        S('backgroundColor', 'black'),
        // alternative style syntax with objects
        S({'color': 'white'}),
        function*() {
            // the E component will wait for the given event, then return the
            // event object.
            let ev = yield* E('click');
            yield* S('border', '1px solid green');
        },
        T('Example Div'));
}
~~~

Imperative uses normal generator control flow. The children of an `H` call will
run in parallel until one of them returns, the return value of that child will
return from `H`.

~~~{.javascript}
function*() {
    let color = yield* H('div',
        H('button', T('Red'), function*() { yield* E('click'); return 'Red'; }),
        H('button', T('Blue'), function*() { yield* E('click'); return 'Blue'; }));
    yield* H('div', `You chose the ${color} pill`);
}
~~~

Sometimes you want the parallel execution without introducing a DOM parent element. This can be accomplished with `multi`.

~~~{.javascript}
function*() {
    let fetchResult = yield* multi(
        // Fetch = fetch wrapped into an imperative component
        Fetch('/api'),
        H('div', T('Waiting for api...')));
    let jsonResult = yield* multi(
        fetchResult.json(),
        H('div', T('Waiting for response body...')));
    yield* H('div', T(JSON.stringify(jsonResult)));
}
~~~

`Fetch` simply wraps `fetch` into an imperative generator, adding
auto-cancellation. The `json` and `text` methods of the response are also
wrapped. `wait` is a similar wrapper for `setTimeout`, and `waitFrame` for
`requestAnimationFrame`.

Many UI problems can be solved using a combination of control flow and parallel
execution. Sometimes we do need a mechanism to communicate between different
pieces of the UI. For this purpose we can use `Var`. `Var` has methods:

~~~
get - get current value
set - set a new value
next - component, will return with next value
fmap - create a new component with the provided function, each time the value changes
~~~

~~~{.javascript}
function*() {
    let color = Var('red');
    yield* H('div',
        H('button', T('red'), function*() { 
            while(true) { 
                yield* E('click'); 
                color.set('red'); 
            } 
        }),
        H('button', T('blue'), function*() { 
            while(true) { 
                yield* E('click'); 
                color.set('blue'); 
            } 
        }),
        H('div', color.fmap(current => T(`you chose the ${current} pill`))));
}
~~~

These functions - `run, HASTE, Var, multi, Fetch, wait` - are the high-level
API of imperative. For low-level operations you need to understand what the
generators are doing. An imperative component is a generator that yields
functions of the form `{H, cleanup} => Promise`. The parent will wait for the
promise, then return its result to the generator. `cleanup` allows you to
register cleanup functions which will run when the generator finishes, or when
it is cut off by a parallel generator finishing. `H` in this context is
different from the main `H`, in a `yield` function the `H` has signature
`DomElement => DomElement` and allows you to access the parent dom element
directly.

Here is an example of using the low-level API to implement intersection observers.

~~~{.javascript}
function* visible(threshold) {
    return yield ({H, cleanup}) => new Promise(resolve => {
        H(elem => {
            let ob = new IntersectionObserver(([entry]) => {
                if(entry.isIntersecting) {
                    resolve(entry);
                }
            }, {threshold}).observe(elem);
            cleanup(() => ob.disconnect());
        })
    });
}
~~~

Another low-level function is `local`. `local` allows you to change the set of
options being passed down into each generator. The HTML DOM-specific API of
imperative is implemented on top of `multi` and `local`, and it is equally easy
to use any other type of persistent UI tree, e.g. within a canvas element.
