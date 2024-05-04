import { WebSocket } from "ws";
import { INIT_GAME, MOVE, JOIN_GAME } from "./messages";
import { Game } from "./Game";

import prisma from "./db";

export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private users: WebSocket[];

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
    // Stop the game here because the user left
    const gameIndex = this.games.findIndex(
      (game) => game.player1 === socket || game.player2 === socket
    );

    if (gameIndex !== -1) {
      const game = this.games[gameIndex];
      if (game.player1 === socket) {
        game.player1 = null;
        if (game.player2) {
          game.player2.send(JSON.stringify({ type: "OPPONENT_DISCONNECTED" }));
        } else {
          this.games.splice(gameIndex, 1);
        }
      } else if (game.player2 === socket) {
        game.player2 = null;
        if (game.player1) {
          game.player1.send(JSON.stringify({ type: "OPPONENT_DISCONNECTED" }));
        } else {
          this.games.splice(gameIndex, 1);
        }
      }
    }
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          // start game
          const game = new Game(this.pendingUser, socket);
          await game.createGameHandler();
          this.games.push(game);
          this.pendingUser = null;
        } else {
          this.pendingUser = socket;
        }
      }

      if (message.type === MOVE) {
        const game = this.games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          game.makeMove(socket, message.payload.move);
        }
      }
    });
  }
}
