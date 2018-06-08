module.exports = w => require("./is")(w) ? w : require("./const")((resolve, reject, isDone) => w)
