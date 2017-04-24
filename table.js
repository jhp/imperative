// WIP

const altFlat = (l,r) => {
  let merged = []
  l = l.slice(0)
  r = r.slice(0)
  let h = undefined
  while(l.length && r.length) {
    let lw = l[0].dimensions[0], rw = r[0].dimensions[0],
        lh = l[0].dimensions[1], rh = r[0].dimensions[1]
    if(lw < rw) {
      ret.push(l.pop())
    } else if(rw < lw) {
      ret.push(r.pop())
    } else if(lh <= rh) {
      ret.push(l.pop())
    } else {
      ret.push(r.pop())
    }
  }
  merged = merged.concat(l).concat(r)
  let h = merged[0].dimensions[1]
  let ret = []
  while(merged.length) {
    let mh = merged[0].dimensions[1]
    if(mh <= h) {
      ret.push(merged.pop())
      h = mh
    } else {
      merged.pop()
    }
  }
  return ret
}

const alt = (l,r) => onLayers(lr => altFlat(lr[0], lr[1]))([l,r])

const table = rows => {
  
}

