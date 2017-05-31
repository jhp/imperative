// WIP

// {width: n, outs: [{height: n, render: (w,h) => out}]}

const alt = (l,r) => {
  if(l.width > r.width) return alt(r, l)
  let outs = []
  for(let ii = 0; ii < r.width - l.width; ii++) {
    let idx = Math.min(ii, l.outs.length-1)
    outs.push(l.outs[idx])
  }
  for(let ii = 0; ii < r.outs.length; ii++) {
    let lidx = Math.min(ii - r.width + l.width, l.outs.length - 1)
    outs.push(
      l.outs[lidx].height <= r.outs[ii].height ? l.outs[lidx] : r.outs[ii])
  }
  for(let ii = r.width + r.outs.length; ii < l.width + l.outs.length; ii++) {
    outs.push(
      l.outs[ii].height <= r.outs[r.outs.length - 1].height ? l.outs[ii] : r.outs[r.outs.length - 1])
  }
  return {width: l.width, outs: outs}
}

const distribExtra = (total, xs) => {
  let excess = total - xs.reduce((x,y) => x + y)
  return xs.map((x,ii) => x + (ii >= (excess % xs.length) ? Math.floor(excess / xs.length) : Math.ceil(excess / xs.length)))
}

const buildCell = (rows, indices) => {
  let rowHeights = rows.map(
    row => row.map((cell, ii) => cell.outs[Math.min(indices[ii], cell.outs.length-1)].height).reduce((x,y) => Math.max(x,y)))
  return {
    height: rowHeights.reduce((x,y) => x+y),
    render: (w,h) => {
      let colWidths = distribExtra(w, rows[0].map((cell, ii) => cell.width + indices[ii]))
      let renderRowHeights = distribExtra(h, rowHeights)
      return rows.map(
        (row, ii) => row.map(
          (cell, jj) => cell.outs[Math.min(indices[ii], cell.outs.length-1)](colWidths[jj], rowHeights[ii])))
    }}
}

const table = rows => {
  let ret = []

  let maxWidths = rows[0].map(
    (cell, ii) => rows.map(row => row[ii].width).reduce((x,y) => Math.max(x,y)))
  rows = rows.map(
    row => row.map((cell, ii) => ({
      width: maxWidths[ii],
      outs: cell.outs.slice(Math.min(cell.outs.length-1, maxWidths[ii] - cell.width))})))

  let indices = rows[0].map(row => 0)

  while(true) {
    ret.push(buildCell(rows, indices))
    const scores = []
    rows.map(row => {
      let tallest = 0
      let tallestIndex
      let score = 0
      row.map((cell, ii) => {
        const idx = Math.min(indices[ii], cell.outs.length - 1)
        if(cell.outs[idx].height >= tallest) {
          const myScore = 0
          for(let jj = idx+1; jj < cell.outs.length; jj++) {
            if(cell.outs[jj].height < cell.outs[idx].height) {
              myScore = (cell.outs[jj].height - cell.outs[idx].height) / (jj - idx)
              break
            }
          }
          if(cell.outs[idx].height > tallest || myScore > score) {
            score = myScore
            tallest = cell.outs[idx].height
            tallestIndex = ii
          }
        }
      })
      if(row[tallestIndex].outs.length > 1) {
        scores[tallestIndex] = (scores[tallestIndex] || 0) + score
      }
    })
    let maxScore = -1, maxIndex = undefined
    for(var ii = 0; ii < rows[0].length; ii++) {
      if(scores[ii] !== undefined) {
        if(scores[ii] > maxScore) {
          maxScore = scores[ii]
          maxIndex = ii
        }
      }
    }
    if(maxIndex === undefined)
      break;
    indices[maxIndex]++
  }
  return ret
}
