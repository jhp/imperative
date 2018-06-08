// n is just used for debugging; really we use the object identity as a unique key for maps
let n = 1

module.exports = () => ({gensym: n++})
