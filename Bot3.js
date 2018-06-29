var Bot3 = /** @class */ (function () {
    function Bot3() {
    }
    Bot3.prototype.makeMove = function (gamestate) {
        var arr = ['R', 'P', 'S'];
        return arr[Math.floor(Math.random() * 3)];
    };
    return Bot3;
}());
module.exports = new Bot3();
