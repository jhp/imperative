let I = require("imperative")

function* Para(txt) {
  yield () => I.h('p', {}, txt)
}

function* Code(txt) {
  yield () => I.h('pre', {}, txt)
}

function* Title(txt) {
  yield () => I.h('h1', {textAlign: 'center'}, txt)
}

function* Sub(txt) {
  yield () => I.h('h2', {}, txt)
}

function* counter() {
  let state = {}
  let n = 0
  while(true) {
    state = (yield* I.clickButton("Clicked " + n, {}, {}, state)).state
    n++
  }
}

function* Example(fn) {
  return yield* I.h(
    'div',
    {style: {backgroundColor: 'white', padding: '4px', border: '2px solid #44b'}},
    [tabSwitcher([
      {label: 'Code', content: Code(fn.toString())},
      {label: 'Live Example', content: function*() {
        while(true) {
          let result = yield* fn()
          yield* I.h('span', {}, [
            "Example Finished with result of ",
            I.h('span', {style: {padding: '4px', border: '1px solid #44b'}}, ""+result),
            I.clickButton("Click to Restart", {}, {})])
        }
      }()}])])
}

I.run(function*() {
  yield* I.h('body', {style: {backgroundColor: '#ffd'}}, [
    I.h('div', {style: {width: '650px', margin: '0 auto'}}, [
      Title('Imperative.js'),
      
      Para('Imperative.js is a UI framework for javascript'),
      Para('It is simple and elegant, with just one function - h - serving as the basis for most programs.'),
      Para('It is flexible - state can be encapsulated in a component or managed externally. Unlike most javascript frameworks, Imperative is not tied to the HTML DOM - you can write Imperative.js code with output to canvas or any other rendering layer.'),
      Para('It is easy to use. As the name suggests, Imperative.js builds components with old-fashioned imperative logic, in ES6 generator functions. There is no need to learn a new computational paradigm to write a UI with Imperative.js.'),
      
      Title('Getting Started'),

      Code('npm install imperative'),
      Code('let I = require("imperative")'),
      Para('Use browserify or webpack to bundle your code for the browser. If you want to support older browsers without native support for generators, you\'ll need to use babel and the regenerator runtime.'),
      
      Title('Examples'),
      
      Sub('Hello, World'),
      Para('Hello, world in imperative.js consists of the following simple function'),
      Example(helloWorldExample),
      Para('An imperative.js program is a javascript generator.'),
      Para('The generator yields functions that return a virtual-dom'),
      Para('The virtual-dom value is built using snabbdom "hyperscript" syntax'),
      Para('To run the program, use the "run" function, with document.body or any other element as the second argument.'),
      
      Sub('Interaction'),
      Example(interactiveExample),
      Para('This is our first interactive example. In this case, we are using the arguments to the function that we yield from the generator'),
      Para('By calling the first argument, resolve, we return a value from the yield statement and continue the generator control-flow'),
      Para('If we were to call the second argument, reject, then we would throw an exception in the generator'),
      Example(rejectExample),
      Para('Any normal javascript control-flow construct can be used with Imperative.js, because the widgets are just generator functions. Loops, conditionals, and function calls all work much as expected. Note that generator functions must be called with a "yield*" annotation.'),
      Example(controlFlowExample),
      
      Sub('Parallel Execution'),
      Para('We can run multiple widgets at once with the "h" function. Imperative.js uses snabbdom to build a virtual-dom, and "h" is based on the same function in snabbdom. However, in Imperative.js, the h function can take widgets as children, as well as plain virtual-dom trees.'),
      Para('When you combine multiple widgets with "h", the behavior is that each widget will run independently as a child of the parent widget; whenever any widget returns a value, that value becomes the return value of the parent widget.'),
      Example(parallelExample),
      
      Sub('Widgets'),
      Para('Basic widgets, such as text input and select boxes, are included with Imperative.js.'),
      Example(widgetsExample),
      Para('Widgets take a state argument, which specifies the value and focus state of the widget. They return on any event, with two keys: the event key shows which event just occurred, the state key shows the current state of the widget'),
      Para('If you don\'t care about every event or state change (for example, if you don\'t care about mouseover or focus changes, but only clicks), then you can just run the widget in a loop until the "event" key shows the event you\'re interested in.'),
      Example(clickButtonExample),

      Sub('Combining Widgets'),
      Example(validationExample),
      Para('This example shows how to combine widgets into a typical validating form. The lowest-level widgets manage detailed state such as input values; but as one moves higher up the call stack, the details are encapsulated.'),

      Sub('Custom Output'),
      Example(treeExample),
      Para('Each Imperative.js widget has an output type. Up to now all the output types have been the same: virtual-dom elements. But Imperative.js is not really coupled to the DOM, and can support any output type.'),
      Para('The function "h" is not actually primitive in Imperative.js; it is implemented with the truly primitive functions, "zip" and "mapOut". "zip" takes a list of widgets with outputs o1, o2, ..., and returns a single widget with output [o1, o2, ...]. "mapOut" maps a function over the output of a widget.'),
      Para('In the example above, we zip together three outputs: the button to collapse/expand the tree, a boolean indicating whether the tree is collapsed or expanded, and the content of the tree. Then we use "mapOut" to add or remove the content from the output, based on the boolean'),
      Para('Custom output is often used to supplement or wrap DOM elements; but one can also use a completely customized output type, as in the canvas example below'), 
      Example(canvasExample),
    ])])
}(), document.body)

function* validationExample() {
  let {name, digit} = yield* nameAndDigit()
  let color = yield* getColor()
  return JSON.stringify({name: name, digit: digit, color: color})
  function* validatedInput(placeholder, check, state) {
    state = Object.assign({value: ''}, state)
    let error = check(state.value)
    let errorSpan = error ? [
      I.h('span', error)
    ] : []

    state = (yield* I.h('span', [
      I.textInput(placeholder, {display: 'block'}, state)
    ].concat(errorSpan))).state
    return {
      value: check(state.value) ? undefined : state.value,
      state: state
    }
  }
  function checkRegex(re, msg) {
    return (str) => str.match(re) ? false : msg
  }
  function* okIfValid(value) {
    if(value) {
      yield* I.clickButton("OK")
      return value
    } else {
      yield () => I.h('div', ['Enter valid values above'])
    }
  }
  function* nameAndDigit() {
    let nameState = {}, digitState = {}
    while(true) {
      let result = yield* I.h('div', {}, [
        function*() {
          nameState = yield* validatedInput(
            'name',
            checkRegex(/./, 'name must be nonempty'),
            nameState.state)
        }(),
        function*() {
          digitState = yield* validatedInput(
            'digit',
            checkRegex(/^[0-9]$/, 'Enter one digit 0-9'),
            digitState.state)
        }(),
        function*() {
          let valid = nameState.value !== undefined
              && digitState.value !== undefined
          return yield* okIfValid(
            valid ? {name: nameState.value, digit: digitState.value} : null)
        }()])
      if(result) return result
    }
  }
  function* getColor() {
    let colorState = {}
    while(true) {
      let result = yield* I.h('div', [
        function*() {
          colorState = yield* validatedInput(
            'color',
            checkRegex(/^[0-9a-f]{6}$/, 'Enter a hex color, like aaaaaa'),
            colorState.state)
        }(),
        function*() {
          return yield* okIfValid(colorState.value)
        }()
      ])
      if(result) return result
    }
  }
}

function* treeExample() {
  yield* I.mapOut(x => { console.log(x); return x })(branch(
    'a', [leaf('q'), leaf('r'),
          branch('b', [leaf('c'), leaf('d')]),
          branch('e', [leaf('f'), leaf('g')])]))
  function* leaf(name) {
    yield () => I.h('span', "Leaf: " + name)
  }
  function* branch(name, children) {
    yield* I.mapOut(
      (([[btn, isOpen], ...children]) => {
        console.log("btn", btn, "isOpen", isOpen, "children", children)
        return I.h('div', isOpen ? [btn, I.h('div', children)] : [btn])
      }
      ))(
      I.zip([header(name)].concat(children)))
  }

  function* header(name) {
    let open = false
    while(true) {
      yield* I.zip([
        I.clickButton(name),
        function*() { yield () => open }()
      ])
      open = !open
    }
  }
  yield () => I.h("span", "Hello, world")
}

function* canvasExample() {

  yield* I.mapOut(toVDom)(
    wrappedAbove(
      colorSequence(['purple', 'white', 'orange'], 300, 100),
      wrappedBeside(
        colorSequence(['red', 'yellow', 'green'], 100, 100),
        colorSequence(['blue', 'green', 'black'], 200, 200))))
  

  // One colored rectangle, with click handler
  function rect(color, w, h, click) {
    return {
      width: w,
      height: h,
      rects: [{
        color: color,
        left: 0,
        top: 0,
        width: w,
        height: h,
        click: click}]}}
  
  // Place one drawing next to another
  function beside(rect1, rect2) {
    return {
      width: rect1.width + rect2.width,
      height: Math.max(rect1.height, rect2.height),
      rects: rect1.rects.concat(
        rect2.rects.map(
          rect => Object.assign({}, rect, {left: rect.left + rect1.width})))
    }
  }
  
  // Place one drawing above another
  function above(rect1, rect2) {
    return {
      width: Math.max(rect1.width, rect2.width),
      height: rect1.height + rect2.height,
      rects: rect1.rects.concat(
        rect2.rects.map(
          rect => Object.assign({}, rect, {top: rect.top + rect1.height})))
    }
  }
  
  // Send click event to the rect that overlaps (if any)
  function handleClick(rects, ev) {
    for(const rect of rects) {
      if(rect.left <= ev.offsetX && rect.left + rect.width >= ev.offsetX
         && rect.top <= ev.offsetY && rect.top + rect.height >= ev.offsetY) {
        return rect.click(ev)
      }
    }
  }
  
  // Draw the rectangles to the canvas
  function draw(rects, canvas) {
    const ctxt = canvas.getContext("2d")
    ctxt.clearRect(0, 0, rect.width, rect.height)
    for(const rect of rects) {
      ctxt.fillStyle = rect.color
      ctxt.fillRect(rect.left, rect.top, rect.width, rect.height)
    }
  }
  
  // Create a virtual-dom element from the drawing
  function toVDom(rects) {
    return I.h('canvas',
               {
                 props: {width: rects.width, height: rects.height},
                 on: {click: ev => handleClick(rects.rects, ev)},
                 hook: {
                   insert: (vnode) => draw(rects.rects, vnode.elm),
                   postpatch: (old, vnode) => draw(rects.rects, vnode.elm)
                 }
               }, [])
  }

  function* wrappedRect(color, w, h) {
    yield (resolve, reject) => rect(color, w, h, ev => resolve(ev))
  }
  
  function* colorSequence(colors, w, h) {
    let ii = 0
    while(true) {
      // clickEvent is ignored, since we always just move to the next color
      const clickEvent = yield* wrappedRect(colors[ii], w, h)
      ii = (ii + 1) % colors.length
    }
  }

  function wrappedBeside(l, r) {
    return I.mapOut(lr => beside(lr[0], lr[1]))(I.zip([l, r]))
  }
  
  function wrappedAbove(l, r) {
    return I.mapOut(lr => above(lr[0], lr[1]))(I.zip([l, r]))
  }
  
}

function* helloWorldExample() {
  yield () => I.h("span", "Hello, world")
}

function* interactiveExample() {
  let event = yield (resolve, reject) =>
      I.h("span", {on: {click: ev => resolve(ev)}}, "Click me")
  yield () => I.h("span", event.type)
}

function* rejectExample() {
  try {
    yield (resolve, reject) =>
      I.h("span", {on: {click: ev => reject(ev)}}, "Click me")
  } catch(e) {
    yield () => I.h("span", "rejected")
  }
}

function* controlFlowExample() {
  for(let ii = 0; ii < 10; ii++) {
    yield* waitForClick(ii)
  }
  function* waitForClick(ii) {
    yield (resolve, reject) =>
      I.h("span", {on: {click: ev => resolve(ev)}}, "Click (" + ii + "/10)")
  }
}

function* parallelExample() {
  return yield* I.h('span', {},
                    [clickable("one"), clickable("two"), clickable("three")])

  function* clickable(value) {
    return yield (resolve, reject) =>
      I.h("span",
          {
            style: {padding: '2px 8px', cursor: 'pointer'},
            on: {click: () => resolve(value)}
          },
          "Click to return " + value)
  }
}


function* widgetsExample() {
  let button = showWidget(
    state => I.button(
      // button can take any markup as content
      I.h('span',
          {style: {
            backgroundColor: '#ddd',
            borderRadius: '8px',
            padding: '3px',
            cursor: 'pointer'}
          }, 'Button'),
      state))

  let radio = showWidget(
    state => I.radio(
      ['one', 'two', 'three'], {display: 'block'}, {display: 'block'}, state))

  let textInput = showWidget(
    state => I.textInput('placeholder', {backgroundColor: '#ffb'}, state))

  let checkbox = showWidget(
    state => I.checkbox('check', {display: 'block'}, state))

  let select = showWidget(
    state => I.select(['one', 'two', 'three'], {}, state))

  yield* I.h('div', [
    button,
    radio,
    textInput,
    checkbox,
    select
  ])
  function* showWidget(w) {
    let state = {}, event = "[No Event]"
    while(true) {
      ({state, event} = yield* I.h(
        'div', {}, [
          w(state),
          "State: " + JSON.stringify(state) + ", event: " + event.type
        ]))
    }
  }
}

function* clickButtonExample() {
  let state = {}, event = {}
  while(event.type !== 'click') {
    ({state, event} = yield* I.button(I.h('span', {}, 'Click me'), state))
  }
  return "Clicked!"
}

function* tabSwitcher(tabs) {
  function* tabRow(tabLabels) {
    let state = {value: tabLabels[0]}
    while(true) {
      state = (yield* I.zip([
        function*() { yield () => tabLabels.indexOf(state.value) }(),
        I.select(tabLabels, {display: 'block'}, state)])).state
    }
  }

  return yield* I.mapOut(([[idx, row], contents]) => I.h('span', [row, contents[idx]]))(
    I.zip([tabRow(tabs.map(tab => tab.label)), I.zip(tabs.map(tab => tab.content))]))

}
