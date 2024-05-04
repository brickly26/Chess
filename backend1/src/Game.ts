import WebSocket from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import prisma from "./db";

export class Game {
  public gameId: string | null = null;
  public player1: WebSocket | null;
  public player2: WebSocket | null;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
  }

  async createGameHandler() {
    await this.createGameInDb();
    if (this.player1) {
      this.player1.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "white",
          },
        })
      );
    }
    if (this.player2) {
      this.player2.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "black",
          },
        })
      );
    }
  }

  async createGameInDb() {
    try {
      const game = await prisma.game.create({
        data: {
          playerWhite: {
            create: {},
          },
          playerBlack: {
            create: {},
          },
        },
        include: {
          playerWhite: true,
          playerBlack: true,
        },
      });
      this.gameId = game.id;
    } catch (error) {}
  }

  makeMove(socket: WebSocket, move: { from: string; to: string }) {
    // Validate type of move using zod

    // Validation (is it this players turn, is the move valid)
    if (this.moveCount % 2 === 0 && socket !== this.player1) {
      return;
    }
    if (this.moveCount % 2 === 1 && socket !== this.player2) {
      return;
    }

    try {
      this.board.move(move);
    } catch (error) {
      return;
    }

    // Check if the game is over
    if (this.board.isGameOver()) {
      this.player1.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        })
      );
      return;
    }

    // Send the update
    if (this.moveCount % 2 === 0) {
      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: {
            move,
          },
        })
      );
    } else {
      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: {
            move,
          },
        })
      );
    }
    this.moveCount++;
  }
}
