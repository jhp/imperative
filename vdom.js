function VDOM(tagName, attrs, children) {
  this.tagName = tagName
  this.attrs = attrs
  this.children = children
  this.body = [].concat.apply(attrs.body ? [attrs.body] : [],
                              children.map(child => child instanceof VDOM ? child.body : []))
}

let vdomMap = new WeakMap()

function patch(vdom, node) {
  if(!vdomMap.has(node) || typeof vdom === "string") {
    let [deferred, vdomNode] = create(vdom)
    node.parentNode.replaceChild(vdomNode, node)
    deferred.map(fn => fn())
    return vdomNode
  }

  let old = vdomMap.get(node)
  if(old === vdom) return node
  
  if(old.tagName !== vdom.tagName) {
    let [deferred, vdomNode] = create(vdom)
    node.parentNode.replaceChild(vdomNode, node)
    deferred.map(fn => fn())
    return vdomNode
  }

  vdomMap.set(node, vdom)
  // reconcile attrs and styles
  for(let key of new Set(Object.keys(old.attrs).concat(Object.keys(vdom.attrs)))) {
    if(key === 'focus' || key === 'selection') continue
    if(key === 'style') {
      for(let styleKey of new Set(Object.keys(old.attrs.style || {}).concat(Object.keys(vdom.attrs.style || {})))) {
        let oldStyle = (old.attrs.style || {})[styleKey]
        let newStyle = (vdom.attrs.style || {})[styleKey]
        if(oldStyle !== newStyle) {
          node.style[ styleKey ] = newStyle == null ? '' : newStyle
        }
      }
    } else {
      if(vdom.attrs[key] !== old.attrs[key]) {
        node[key] = vdom.attrs[key] == null ? '' : vdom.attrs[key]
      }
    }
  }
  if(vdom.attrs.focus && node !== document.activeElement)
    node.focus()
  if(!vdom.attrs.focus && node === document.activeElement)
    node.blur()
  if(vdom.attrs.selection && node === document.activeElement) {
    node.setSelectionRange(vdom.attrs.selection[0], vdom.attrs.selection[1])
  }
  // reconcile children - a simple algorithm with no attempt to keep track of shuffled lists
  let nodeChild = node.firstChild
  for(let child of vdom.children) {
    if(nodeChild && nodeChild.nodeType === 3 && typeof child === 'string' && child === nodeChild.data) {
      nodeChild = nodeChild.nextSibling
      continue
    }
    while(nodeChild && nodeChild.nodeType !== 1) {
      let next = nodeChild.nextSibling
      node.removeChild(nodeChild)
      nodeChild = next
    }
    if(nodeChild) {
      let next = nodeChild.nextSibling
      patch(child, nodeChild)
      nodeChild = next
    } else {
      let [deferred, childNode] = create(child)
      node.appendChild(childNode)
      deferred.map(fn => fn())
    }
  }
  if(nodeChild) {
    while(nodeChild.nextSibling) {
      node.removeChild(nodeChild.nextSibling)
    }
    node.removeChild(nodeChild)
  }
  return node
  function create(vdom) {
    if(typeof vdom === "string") return [[], document.createTextNode(vdom)]

    let node = document.createElement(vdom.tagName)
    vdomMap.set(node, vdom)
    for(let key of Object.keys(vdom.attrs)) {
      if(key === 'focus' || key === 'selection') continue
      if(key === 'style') {
        for(let styleKey of Object.keys(vdom.attrs.style)) {
          node.style[ styleKey ] = vdom.attrs.style[ styleKey ]
        }
      } else {
        node[ key ] = vdom.attrs[ key ]
      }
    }
    let deferred = []
    for(let child of vdom.children) {
      let [childDeferred, childNode] = create(child)
      node.appendChild(childNode)
      deferred.push.apply(deferred, childDeferred)
    }
    if(vdom.attrs['focus']) {
      deferred.push(() => node.focus())
    }
    if(vdom.attrs['selection']) {
      let [start, end] = vdom.attrs['selection']
      deferred.push(() => node.setSelectionRange(start, end))
    }
    return [deferred, node]
  }
}

module.exports = {VDOM, patch}
