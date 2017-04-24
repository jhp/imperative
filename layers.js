// WIP

const layer0 = gensym()

const newLayer = fn => {
  const layer = gensym()
  return mapOut(o => finish => collapseLayer(layer)(o(finish)))(fn(layer))
}

const collapseLayer = layer => layers => {
  let ret = new Map(layers)
  ret.set(layer0, layerDom(layers.get(layer0), layers.get(layer)))
  ret.delete(layer)
  return ret
}

const layerDom = (bot, tops) => bot.map(
  instance => ({dimensions: instance.dimensions, render: (w,h) => {
    Dom.elementOpen('span', '', [], 'style', {position: 'relative'})
    instance.render()
    tops.map(top => top(w,h))
    return Dom.elementClose('span')
  }}))

const onLayers = fn => ms => {
  let ret = new Map()
  
  let allKeys = new Set()
  ms.map(m => [...m.keys()].map(k => allKeys.add(k)))
  allKeys.delete(layer0)
  allKeys.forEach(k => {
    let v = []
    ms.map(m => { if(m.has(k)) v = v.concat(m.get(k)) })
  })
  ret.set(layer0, fn(ms.map(m => m.get(layer0))))
  return ret
}
