let n = 1
// n is just used for debugging; really we use the object identity as a unique key for maps
module.exports = () => { return {gensym: n++} }
