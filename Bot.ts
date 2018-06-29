interface Round {
    p1: string,
    p2: string
}

interface roundResult {
    p1: number,
    p2: number
}

class Move {
    public p1;
    public p2;
    public constructor(round: Round){
        this.p1 = round.p1;
        this.p2 = round.p2;
    }
    public equals(p1, p2){
        return (this.p1 === p1 && this.p2 === p2);
    }
    public equalsAny(moves: string[][]){
        for(let move of moves){
            if(this.equals(move[0], move[1])){
                return true;
            }
        }
        return false;
    }

    public getRoundResult(): number{
        if(this.draw()){
            return 0
        } else if(this.win()){
            return 1
        } else {
            return -1
        }
    }

    public draw(){
        return this.p1 === this.p2;
    }
    public win(){
        const traditionalWinningMoves = [['R', 'S'],['S', 'P'],['P','R']];
        if(this.equalsAny(traditionalWinningMoves)){
            return true;
        }
        if(this.p1 === 'D' && !this.draw() && this.p2 !== 'W'){
            return true;
        }
        if(this.p1 === 'W' && this.p2 === 'D'){
            return true;
        } else {
            return false;
        }
    }
}

class GameAnalyser {
    private stats = {}
    constructor(public gamestate, public keylength){
        this.generateGameStatsFromGameState();
    }

    public predictNextMoveOfOpponent(){
        let key = this.generateKeyFromGamestate(this.gamestate.rounds.length, this.keylength);
        // console.log(this.stats)
        // console.log(this.stats[key]);
        return this.stats[key];
    }

    public setStats(key: string, nextOpponentHand: string){
        if(this.stats[key]){
            if(this.stats[key][nextOpponentHand]){
                this.stats[key][nextOpponentHand] += 1;
            } else {
                this.stats[key][nextOpponentHand] = 1;
            }
        } else {
            this.stats[key] = {};
            this.stats[key][nextOpponentHand] = 1;
        }
    }

    public generateGameStatsFromGameState(){
        for(let lastInd = this.gamestate.rounds.length - 1; lastInd >= this.keylength; lastInd--){
            let key: string = this.generateKeyFromGamestate(lastInd, this.keylength);
            this.setStats(key, this.gamestate.rounds[lastInd].p2);
        }
    }
    public generateKeyFromGamestate(lastInd, keylength): string{
        let key = "";
        if(lastInd >= keylength) {
            for (let i = 1; i <= keylength; i++) {
                let round = this.gamestate.rounds[lastInd - i];
                key += round.p1 + round.p2;
            }
        }
        return key;
    }
}

class GameStrategy {
    private remainingDynamites = 100;
    private remainingRounds = 2500;
    private pointsForRound = 1;
    constructor(public gamestate, public nextMovesOfOpponent){
        this.setRemainingDynamites();
        this.setRemainingRounds();
        this.setPointsForRound();
    }
    public myNextMove(){
        if(!this.nextMovesOfOpponent){
            let arr = ['R', 'P', 'S']
            return arr[Math.floor(Math.random()*3)];
        }
        let hands = ['R', 'P', 'S', 'D', 'W'];
        let predictedPointDiffs = {'R': 0, 'P': 0, 'S': 0, 'D': 0, 'W': -0.5};
        for(let myNextHand of hands){
            for(let opponentNextHand of hands){
                let occurrencesOfOpponentHand = this.nextMovesOfOpponent[opponentNextHand];
                if(occurrencesOfOpponentHand){
                    let probabilityOfOpponentHand = occurrencesOfOpponentHand / this.gamestate.rounds.length;
                    // console.log(probabilityOfOpponentHand)
                    predictedPointDiffs[myNextHand] += this.pointsForRound * probabilityOfOpponentHand * new Move({p1: myNextHand, p2: opponentNextHand}).getRoundResult();
                }
            }
        }
        predictedPointDiffs = this.dynamiteFactor(predictedPointDiffs);
        console.log(predictedPointDiffs);
        const winningHand = Object.keys(predictedPointDiffs).reduce((a, b) => predictedPointDiffs[a] > predictedPointDiffs[b] ? a : b);
        // console.log(winningHand);
        console.log(this.remainingDynamites)
        return winningHand;
    }

    public dynamiteFactor(predictedPointDiffs){
        if(this.remainingDynamites == 0){
            delete predictedPointDiffs.D
        } else {
            predictedPointDiffs.D += 1 - (this.remainingRounds - 800) / (25 * this.remainingDynamites);
        }
        return predictedPointDiffs
    }

    public setRemainingDynamites(){
        for(let round of this.gamestate.rounds){
            if(round.p1 === 'D'){
                this.remainingDynamites -= 1;
            }
        }
    }
    public setRemainingRounds(){
        this.remainingRounds -= this.gamestate.rounds.length;
    }
    public setPointsForRound(){
        for(let i = this.gamestate.rounds.length - 1; i >= 0; i--){
            const round = this.gamestate.rounds[i];
            if(new Move(round).draw()){
                this.pointsForRound += 1;
            } else {
                break;
            }
        }
    }
}

class Bot {

    public makeMove(gamestate) {
        const gameAnalyser = new GameAnalyser(gamestate, 3);
        let nextMovesOfOpponent = gameAnalyser.predictNextMoveOfOpponent();
        const gameStrategy = new GameStrategy(gamestate, nextMovesOfOpponent);
        return gameStrategy.myNextMove();
    }

}

class Test {
    public getResult() {
        console.log(new Move({p1: 'R', p2: 'R'}).getRoundResult());
        console.log(new Move({p1: 'R', p2: 'P'}).getRoundResult());
        console.log(new Move({p1: 'R', p2: 'S'}).getRoundResult());
        console.log(new Move({p1: 'R', p2: 'D'}).getRoundResult());
        console.log(new Move({p1: 'W', p2: 'D'}).getRoundResult());
        console.log(new Move({p1: 'W', p2: 'R'}).getRoundResult());
        console.log(new Move({p1: 'D', p2: 'R'}).getRoundResult());
        console.log(new Move({p1: 'D', p2: 'W'}).getRoundResult());
    }
    public testGameAnalyser(){
        let gamestate = {rounds: [
            {
                p1 : "R",
                p2 : "D"
            },
            {
                p1 : "W",
                p2 : "S"
            },
            {
                p1 : "W",
                p2 : "S"
            },
            {
                p1 : "W",
                p2 : "S"
            },
            {
                p1 : "W",
                p2 : "S"
            },
            {
                p1 : "W",
                p2 : "S"
            }]
        }
        const gameAnalyser = new GameAnalyser(gamestate, 1);
        console.log(gameAnalyser.predictNextMoveOfOpponent());
    }
}

const test = new Test();
test.getResult()
// test.testGameAnalyser()

module.exports = new Bot();