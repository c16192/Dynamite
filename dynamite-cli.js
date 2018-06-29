/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const fs = __webpack_require__(1);
const play = __webpack_require__(2);

// Check if the arguments are numbers for games, dynamite, and score to win
if ((process.argv[4] && isNaN(process.argv[4])) || (process.argv[5] && isNaN(process.argv[5])) || (process.argv[6] && isNaN(process.argv[6])) || process.argv.length < 4) {
    console.log('Specify 2 arguments with the file path to the bots:');
    console.log('\n\tnode dynamite-cli.js myBot1.js myBot2.js\n');
    console.log('You may also optionally specify the number of matches, score to win, and number of dynamite (in that order)');
    console.log('\n\tnode dynamite-cli.js myBot1.js myBot2.js 10 1000 100\n');
    process.exit(1);
}

const args = {
    botPath1: process.argv[2],
    botPath2: process.argv[3],
    games: process.argv[4],
    scoreToWin: process.argv[5],
    dynamite: process.argv[6]
};

let games = args.games ? process.argv[4]: 1;
let scoreToWin = args.scoreToWin ? process.argv[5] : 1000;
let dynamite = args.dynamite ? process.argv[6] : 100;

// Options for the game
const options = {scoreToWin: scoreToWin, roundLimit: null, dynamite: dynamite, games: games};
options.roundLimit = options.scoreToWin*2.5;

// Load a bot using eval
function loadBot(path) {
    const botContent = fs.readFileSync(path, 'utf-8');
    const module = {};
    eval(botContent);
    return module.exports;
}


const bot1 = loadBot(args.botPath1);
const bot2 = loadBot(args.botPath2);

// Dummy runner client that directly references the loaded bots using IDs 1 and 2
class CliRunnerClient {
    createInstance(botId) {
        return Promise.resolve(botId);
    }

    makeMove(instanceId, gamestate) {
        try {
            switch(instanceId) {
                case 1: return Promise.resolve(bot1.makeMove(gamestate));
                case 2: return Promise.resolve(bot2.makeMove(gamestate));
                default: return Promise.reject('No such bot');
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    deleteInstance(instanceId) {
        return Promise.resolve();
    }
}

const cliRunnerClient = new CliRunnerClient();

function playGames(gamesRemaining){
    if (gamesRemaining > 0){
        play(1, 2, cliRunnerClient, cliRunnerClient, options, console)
            .then(output => {
                console.log(`Game ${options.games - gamesRemaining + 1} results:`);
                console.log(`Winner: p${output.winner}`);
                console.log(`Score: ${output.score[1]} - ${output.score[2]}`);
                console.log(`Reason: ${output.reason}`);
                if (output.errorBot) {
                    console.log(`Player ${output.errorBot} failed:\n${output.errorStack}`);
                }
                playGames(gamesRemaining - 1);
            })
            .catch((err) => console.error('UNEXPECTED ERROR:', err));
    }
}

playGames(options.games);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

// N.B. Avoid importing modules here where possible,
// these will be included in the bundled dynamite-cli.js
const Game = __webpack_require__(3);

/**
 * Play a game with the bots
 *
 * @param botId1 ID of the first bot
 * @param botId2 ID of the second bot
 * @param runnerClient1 client for the first bot
 * @param runnerClient2 client for the second bot
 * @param gameOptions game options (dynamite, scoreToWin and roundLimit)
 * @param logger logger for instantiation errors
 *
 * @returns Promise<Result>, where Result contains the following properties:
 *   botIds: {1: <bot1Id>, 2: <bot2Id>}
 *   winner: <winning bot> (1 or 2)
 *   score: {1: <bot1score>, 2: <bot2score>}
 *   gamestate: <final gamestate>
 *   reason: <string description of why the game ended>
 *   errorBot: <error bot> (1, 2 or undefined)
 *   errorReason: <reason for the error, see BotError>
 *   errorStack: <stack trace of the error>
 */
function play(botId1, botId2, runnerClient1, runnerClient2, gameOptions, logger) {

    const runGame = (instanceIds) => {
        const game = new Game(instanceIds, runnerClient1, runnerClient2, gameOptions);
        return game.play().then(result => {
            game.deleteBots();
            result.botIds = {1: botId1, 2: botId2};
            return result;
        });
    };

    // Create the bots one at a time, to avoid awkward logic if they fail to instantiate
    return runnerClient1.createInstance(botId1)
        .then(instanceId1 => runnerClient2.createInstance(botId2)
            .then(instanceId2 => runGame([instanceId1, instanceId2]), err => {
                logger.error(`Error creating bot ${botId2}: ` + err);
                // Error creating the second instance, so delete the first
                runnerClient1.deleteInstance(instanceId1);
                return startupErrorResult(botId1, botId2, 2);
            }))
        .catch(err => {
            logger.error(`Error creating bot ${botId1}: ` + err);
            return startupErrorResult(botId1, botId2, 1);
        });
}

function startupErrorResult(botId1, botId2, errorBot) {
    return {
        botIds: {1: botId1, 2: botId2},
        winner: 3 - errorBot,
        score: {1:0, 2:0},
        gamestate: {rounds: []},
        reason: 'error',
        errorBot: errorBot,
        errorReason: 'startupError'
    };
}

module.exports = play;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

// N.B. Avoid importing modules here where possible,
// these will be included in the bundled dynamite-cli.js
const {BotError} = __webpack_require__(4);

const VALID_MOVES = ['R','P','S','W','D'];

class Game {

    constructor(instanceIds, runnerClient1, runnerClient2, options) {
        this.instanceIds = {1: instanceIds[0], 2: instanceIds[1]};
        this.score = {1: 0, 2: 0};
        this.dynamite = {1: options.dynamite, 2: options.dynamite};
        this.gamestate = {1: {rounds: []}, 2: {rounds: []}};

        this.scoreToWin = options.scoreToWin;
        this.roundLimit = options.roundLimit;
        this.runnerClient1 = runnerClient1;
        this.runnerClient2 = runnerClient2;
        this.nextRoundPoints = 1;
    }

    updateDynamite(moves) {
        for (let i = 1; i <= 2; i++) {
            if (moves[i] === 'D') {
                this.dynamite[i] -= 1;
            }
            if (this.dynamite[i] < 0) {
                throw new BotError(i, 'dynamite');
            }
        }
    }

    updateGamestate(moves) {
        this.gamestate[1].rounds.push({p1: moves[1], p2: moves[2]});
        this.gamestate[2].rounds.push({p1: moves[2], p2: moves[1]});
    }

    updateScore(moves) {
        // Check the moves are valid
        if (!VALID_MOVES.includes(moves[1])) {
            throw new BotError(1, 'invalidMove', moves[1]);
        }
        if (!VALID_MOVES.includes(moves[2])) {
            throw new BotError(2, 'invalidMove', moves[2]);
        }

        // Check for a tie
        if (moves[1] === moves[2]) {
            this.nextRoundPoints += 1;
            return;
        }

        // Check for a winner
        if (
            (moves[1] === 'D' && moves[2] !== 'W') ||
            (moves[1] === 'W' && moves[2] === 'D') ||
            (moves[1] === 'R' && moves[2] === 'S') ||
            (moves[1] === 'S' && moves[2] === 'P') ||
            (moves[1] === 'P' && moves[2] === 'R') ||
            (moves[1] !== 'D' && moves[2] === 'W')
        ) {
            this.score[1] += this.nextRoundPoints;
        } else {
            this.score[2] += this.nextRoundPoints;
        }
        this.nextRoundPoints = 1;
    }

    getOutput(reason, err) {
        const output = {
            winner: this.score[1] > this.score[2] ? 1 : 2,
            score: this.score,
            gamestate: this.gamestate[1],
            reason: reason
        };

        if (err && err.errorPlayer) {
            output.errorBot = err.errorPlayer;
            output.errorReason = err.errorReason;
            output.errorStack = err.stack;
            output.winner = 3 - err.errorPlayer;
        }

        return output;
    }

    play() {
        if (this.scoreToWin <= Math.max(this.score[1], this.score[2])) {
            return this.getOutput('score');
        }
        if (this.gamestate[1].rounds.length >= this.roundLimit) {
            return this.getOutput('round limit');
        }
        return Promise.all([
            this.runnerClient1.makeMove(this.instanceIds[1], this.gamestate[1])
                .catch(err => this.handleBotError(err, 1)),
            this.runnerClient2.makeMove(this.instanceIds[2], this.gamestate[2])
                .catch(err => this.handleBotError(err, 2)),
        ])
            .then(res => {
                const moves = {1: res[0], 2: res[1]};
                this.updateGamestate(moves);
                this.updateDynamite(moves);
                this.updateScore(moves);
            })
            .then(() => this.play())
            .catch(err => this.getOutput('error', err));
    }

    handleBotError(err, playerNum) {
        if (err.response && err.response.body && err.response.body.errName === 'InvalidMoveError') {
            throw new BotError(playerNum, 'invalidMove');
        } else {
            throw new BotError(playerNum, 'error', err);
        }
    }

    deleteBots() {
        return Promise.all([
            this.runnerClient1.deleteInstance(this.instanceIds[1]),
            this.runnerClient2.deleteInstance(this.instanceIds[2])
        ]);
    }

}

module.exports = Game;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

class BotError extends Error {

    // errorPlayer should be 1 or 2 as appropriate.
    //
    // Valid reasons are: 'invalidMove', 'dynamite', 'startupError' and 'error'. If these are changed or added to then
    // frontend/src/helpers/errorMatchResultHelper.js and frontend/src/botMatchForm.jsx getMatchResultText() need
    // to be updated.
    //
    // Optionally specify a 'cause' error object, to preserve error information.
    constructor(errorPlayer, reason, cause) {
        super(reason);
        this.status = 400;
        Error.captureStackTrace(this);
        if (cause) {
            this.stack += '\nCaused by:\n' + (cause.stack || cause);
        }
        this.name = this.constructor.name;
        this.errorPlayer = errorPlayer;
        this.errorReason = reason;
    }
}

class TournamentInProgressError extends Error {
    constructor() {
        super();
        this.status = 409;
        Error.captureStackTrace(this);
        this.name = this.constructor.name;
        this.message = 'Tournament already running';
    }
}

module.exports = {BotError, TournamentInProgressError};


/***/ })
/******/ ]);