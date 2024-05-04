"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = "";
        this.moves = [];
        this.startTime = new Date();
    }
    makeMove(socket, move) {
        // Validation (is it this players turn, is the move valid)
        // Update board
        // Check if the game is over
        // Send the update
        if (socket === this.player1 || socket === this.player2) {
        }
    }
}
exports.Game = Game;
