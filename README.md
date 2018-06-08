Imperative.js - Structured UI Programming with ES6 Generators
===========================================================

For a brief introduction to the idea behind Imperative, see <http://jasonhpriestley.com/flows>.

To install Imperative, `npm install imperative`.

Run
---

`run(flow, node)` will run a flow in the given DOM node.

```js
run(function*() {
  yield () => h('span', 'Hello, Imperative')
}(), document.body)
```

h
-

`h(nodeName, attrs?, children | [children], ...)` builds virtual-dom nodes from virtual-dom node children, or flows from flow children.

```js
// an empty span virtual-dom node
h('span')

// attributes, including style, can be set with a JS object as the second argument
h('span', {style: {color: 'red'}}) 

// children, either strings or other virtual-dom nodes, can be passed in further arguments
// any number of children can be passed in, singly or in arrays
h('div', {}, 
   h('span', {}, 'child one'), 
   [h('span', {}, 'child two'), h('span', {}, 'child three')])

// the attributes argument is optional
h('div', 'no attributes')

// if the children are a flow, then the parent is a flow
h('div', function*() { yield () => h('span') }())

// the containing flow will return as soon as any child returns
// this example will immediately return 1
h('div', function*() { return 1 }, function*() { yield () => h('span') })
```

mapOut and zip
--------------

`h` is built on top of two more-fundamental operations, `mapOut` and `zip`.

`mapOut(fn)(flow)` will apply `fn` to the output type of `flow`, creating a new flow.

`zip(flows)` will turn an array of flows into a flow with an array as output type.

```js
// alternative to calling polymorphic h('div', flow1, flow2)
mapOut(children => h('div', children))(zip([child1, child2]))
```

`mapOut` and `zip` can be used explicitly to pass extra information
with the output, or to use output types beside a vdom element. The final
output of the flow passed to `run` should be a vdom node though.

