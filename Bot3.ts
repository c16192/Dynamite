class Bot3 {
    makeMove(gamestate) {

        let arr = ['R', 'P', 'S']
        return arr[Math.floor(Math.random()*3)];
    }
}

module.exports = new Bot3();