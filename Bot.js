var Move = /** @class */ (function () {
    function Move(round) {
        this.p1 = round.p1;
        this.p2 = round.p2;
    }
    Move.prototype.equals = function (p1, p2) {
        return (this.p1 === p1 && this.p2 === p2);
    };
    Move.prototype.equalsAny = function (moves) {
        for (var _i = 0, moves_1 = moves; _i < moves_1.length; _i++) {
            var move = moves_1[_i];
            if (this.equals(move[0], move[1])) {
                return true;
            }
        }
        return false;
    };
    Move.prototype.getRoundResult = function () {
        if (this.draw()) {
            return 0;
        }
        else if (this.win()) {
            return 1;
        }
        else {
            return -1;
        }
    };
    Move.prototype.draw = function () {
        return this.p1 === this.p2;
    };
    Move.prototype.win = function () {
        var traditionalWinningMoves = [['R', 'S'], ['S', 'P'], ['P', 'R']];
        if (this.equalsAny(traditionalWinningMoves)) {
            return true;
        }
        if (this.p1 === 'D' && !this.draw() && this.p2 !== 'W') {
            return true;
        }
        if (this.p1 === 'W' && this.p2 === 'D') {
            return true;
        }
        else {
            return false;
        }
    };
    return Move;
}());
var GameAnalyser = /** @class */ (function () {
    function GameAnalyser(gamestate, keylength) {
        this.gamestate = gamestate;
        this.keylength = keylength;
        this.stats = {};
        this.generateGameStatsFromGameState();
    }
    GameAnalyser.prototype.predictNextMoveOfOpponent = function () {
        var key = this.generateKeyFromGamestate(this.gamestate.rounds.length, this.keylength);
        // console.log(this.stats)
        // console.log(this.stats[key]);
        return this.stats[key];
    };
    GameAnalyser.prototype.setStats = function (key, nextOpponentHand) {
        if (this.stats[key]) {
            if (this.stats[key][nextOpponentHand]) {
                this.stats[key][nextOpponentHand] += 1;
            }
            else {
                this.stats[key][nextOpponentHand] = 1;
            }
        }
        else {
            this.stats[key] = {};
            this.stats[key][nextOpponentHand] = 1;
        }
    };
    GameAnalyser.prototype.generateGameStatsFromGameState = function () {
        for (var lastInd = this.gamestate.rounds.length - 1; lastInd >= this.keylength; lastInd--) {
            var key = this.generateKeyFromGamestate(lastInd, this.keylength);
            this.setStats(key, this.gamestate.rounds[lastInd].p2);
        }
    };
    GameAnalyser.prototype.generateKeyFromGamestate = function (lastInd, keylength) {
        var key = "";
        if (lastInd >= keylength) {
            for (var i = 1; i <= keylength; i++) {
                var round = this.gamestate.rounds[lastInd - i];
                key += round.p1 + round.p2;
            }
        }
        return key;
    };
    return GameAnalyser;
}());
var GameStrategy = /** @class */ (function () {
    function GameStrategy(gamestate, nextMovesOfOpponent) {
        this.gamestate = gamestate;
        this.nextMovesOfOpponent = nextMovesOfOpponent;
        this.remainingDynamites = 100;
        this.remainingRounds = 2500;
        this.pointsForRound = 1;
        this.setRemainingDynamites();
        this.setRemainingRounds();
        this.setPointsForRound();
    }
    GameStrategy.prototype.myNextMove = function () {
        if (!this.nextMovesOfOpponent) {
            var arr = ['R', 'P', 'S'];
            return arr[Math.floor(Math.random() * 3)];
        }
        var hands = ['R', 'P', 'S', 'D', 'W'];
        var predictedPointDiffs = { 'R': 0, 'P': 0, 'S': 0, 'D': 0, 'W': -0.5 };
        for (var _i = 0, hands_1 = hands; _i < hands_1.length; _i++) {
            var myNextHand = hands_1[_i];
            for (var _a = 0, hands_2 = hands; _a < hands_2.length; _a++) {
                var opponentNextHand = hands_2[_a];
                var occurrencesOfOpponentHand = this.nextMovesOfOpponent[opponentNextHand];
                if (occurrencesOfOpponentHand) {
                    var probabilityOfOpponentHand = occurrencesOfOpponentHand / this.gamestate.rounds.length;
                    // console.log(probabilityOfOpponentHand)
                    predictedPointDiffs[myNextHand] += this.pointsForRound * probabilityOfOpponentHand * new Move({ p1: myNextHand, p2: opponentNextHand }).getRoundResult();
                }
            }
        }
        predictedPointDiffs = this.dynamiteFactor(predictedPointDiffs);
        console.log(predictedPointDiffs);
        var winningHand = Object.keys(predictedPointDiffs).reduce(function (a, b) { return predictedPointDiffs[a] > predictedPointDiffs[b] ? a : b; });
        // console.log(winningHand);
        console.log(this.remainingDynamites);
        return winningHand;
    };
    GameStrategy.prototype.dynamiteFactor = function (predictedPointDiffs) {
        if (this.remainingDynamites == 0) {
            delete predictedPointDiffs.D;
        }
        else {
            predictedPointDiffs.D += 1 - (this.remainingRounds - 800) / (25 * this.remainingDynamites);
        }
        return predictedPointDiffs;
    };
    GameStrategy.prototype.setRemainingDynamites = function () {
        for (var _i = 0, _a = this.gamestate.rounds; _i < _a.length; _i++) {
            var round = _a[_i];
            if (round.p1 === 'D') {
                this.remainingDynamites -= 1;
            }
        }
    };
    GameStrategy.prototype.setRemainingRounds = function () {
        this.remainingRounds -= this.gamestate.rounds.length;
    };
    GameStrategy.prototype.setPointsForRound = function () {
        for (var i = this.gamestate.rounds.length - 1; i >= 0; i--) {
            var round = this.gamestate.rounds[i];
            if (new Move(round).draw()) {
                this.pointsForRound += 1;
            }
            else {
                break;
            }
        }
    };
    return GameStrategy;
}());
var Bot = /** @class */ (function () {
    function Bot() {
    }
    Bot.prototype.makeMove = function (gamestate) {
        var gameAnalyser = new GameAnalyser(gamestate, 3);
        var nextMovesOfOpponent = gameAnalyser.predictNextMoveOfOpponent();
        var gameStrategy = new GameStrategy(gamestate, nextMovesOfOpponent);
        return gameStrategy.myNextMove();
    };
    return Bot;
}());
var Test = /** @class */ (function () {
    function Test() {
    }
    Test.prototype.getResult = function () {
        console.log(new Move({ p1: 'R', p2: 'R' }).getRoundResult());
        console.log(new Move({ p1: 'R', p2: 'P' }).getRoundResult());
        console.log(new Move({ p1: 'R', p2: 'S' }).getRoundResult());
        console.log(new Move({ p1: 'R', p2: 'D' }).getRoundResult());
        console.log(new Move({ p1: 'W', p2: 'D' }).getRoundResult());
        console.log(new Move({ p1: 'W', p2: 'R' }).getRoundResult());
        console.log(new Move({ p1: 'D', p2: 'R' }).getRoundResult());
        console.log(new Move({ p1: 'D', p2: 'W' }).getRoundResult());
    };
    Test.prototype.testGameAnalyser = function () {
        var gamestate = { rounds: [
                {
                    p1: "R",
                    p2: "D"
                },
                {
                    p1: "W",
                    p2: "S"
                },
                {
                    p1: "W",
                    p2: "S"
                },
                {
                    p1: "W",
                    p2: "S"
                },
                {
                    p1: "W",
                    p2: "S"
                },
                {
                    p1: "W",
                    p2: "S"
                }
            ]
        };
        var gameAnalyser = new GameAnalyser(gamestate, 1);
        console.log(gameAnalyser.predictNextMoveOfOpponent());
    };
    return Test;
}());
var test = new Test();
test.getResult();
// test.testGameAnalyser()
module.exports = new Bot();
