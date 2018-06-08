module.exports = w => !!(w.next && typeof w.next === 'function' && w.throw && typeof w.throw === 'function')
