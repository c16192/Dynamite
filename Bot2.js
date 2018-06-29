var Bot2 = /** @class */ (function () {
    function Bot2() {
    }
    Bot2.prototype.makeMove = function (gamestate) {
        var arr = ['R', 'P', 'S'];
        return arr[Math.floor(Math.random() * 3)];
    };
    return Bot2;
}());
module.exports = new Bot2();
