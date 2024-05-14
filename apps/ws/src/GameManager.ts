import { WebSocket } from "ws";
import {
  GAME_OVER,
  INIT_GAME,
  JOIN_GAME,
  MOVE,
  OPPONENT_DISCONNECTED,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ALERT,
  GAME_ADDED,
} from "./messages";
import { Game, isPromoting } from "./Game";
import { prisma } from "./db";
import { SocketManager, User } from "./SocketManager";
import { Square } from "chess.js";

export class GameManager {
  private games: Game[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  addUser(user: User) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(socket: WebSocket) {
    const user = this.users.find((user) => user.socket !== socket);

    if (!user) {
      console.error("User not found?");
      return;
    }

    this.users = this.users.filter((user) => user.socket !== socket);
    console.log("remove User called");
    SocketManager.getInstance().removeUser(user);
  }

  removeGame(gameId: string) {
    this.games = this.games.filter((game) => gameId !== game.gameId);
  }

  private addHandler(user: User) {
    user.socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === INIT_GAME) {
        if (this.pendingGameId) {
          // start game
          const game = this.games.find((x) => x.gameId === this.pendingGameId);
          if (!game) {
            console.log("Pending game not found?");
            return;
          }
          if (user.userId === game.player1UserId) {
            SocketManager.getInstance().broadcast(
              game.gameId,
              JSON.stringify({
                type: GAME_ALERT,
                payload: {
                  message: "Trying to connect with yourself?",
                },
              })
            );
            return;
          }
          SocketManager.getInstance().addUser(user, game.gameId);
          await game?.updateSecondPlayer(user.userId);
          this.pendingGameId = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.push(game);
          this.pendingGameId = game.gameId;
          SocketManager.getInstance().addUser(user, game.gameId);
          SocketManager.getInstance().broadcast(
            game.gameId,
            JSON.stringify({
              type: GAME_ADDED,
            })
          );
        }
      }

      if (message.type === MOVE) {
        const gameId = message.payload.gameId;
        const game = this.games.find((game) => game.gameId === gameId);
        if (game) {
          game.makeMove(user, message.payload.move);
          game.clearTimer();
          const timer = setTimeout(() => {
            game.endGame();
            this.removeGame(game.gameId);
          }, 60 * 1000);
          game.setTimer(timer);
        }
      }

      if (message.type === JOIN_GAME) {
        const gameId = message.payload?.gameId;
        if (!gameId) {
          return;
        }

        const availableGame = this.games.find((game) => game.gameId === gameId);

        const gameFromDb = await prisma.game.findUnique({
          where: {
            id: gameId,
          },
          include: {
            moves: {
              orderBy: {
                moveNumber: "asc",
              },
            },
            blackPlayer: true,
            whitePlayer: true,
          },
        });

        if (!gameFromDb) {
          user.socket.send(
            JSON.stringify({
              type: GAME_NOT_FOUND,
            })
          );
          return;
        }

        if (!availableGame) {
          const game =
            availableGame ??
            new Game(gameFromDb?.whitePlayerId!, gameFromDb?.blackPlayerId!);
          gameFromDb?.moves.forEach((move: { from: string; to: string }) => {
            game.board.move(move);
          });
          this.games.push(game);
        }

        user.socket.send(
          JSON.stringify({
            type: GAME_JOINED,
            payload: {
              gameId,
              moves: gameFromDb.moves,
              blackPlayer: {
                id: gameFromDb?.blackPlayerId,
                name: gameFromDb?.blackPlayer.name,
              },
              whitePlayer: {
                id: gameFromDb?.blackPlayerId,
                name: gameFromDb?.whitePlayer.name,
              },
            },
          })
        );

        SocketManager.getInstance().addUser(user, gameId);
      }
    });
  }
}
