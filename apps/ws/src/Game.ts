import WebSocket from "ws";
import { Chess, Square } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE, USER_TIMEOUT } from "./messages";
import { prisma } from "./db";
import { randomUUID } from "crypto";
import { SocketManager, User } from "./SocketManager";

export function isPromoting(chess: Chess, from: Square, to: Square) {
  if (!from) {
    return false;
  }

  const piece = chess.get(from);

  if (piece?.type !== "p") {
    return false;
  }

  if (piece.color !== chess.turn()) {
    return false;
  }

  if (!["1", "8"].some((it) => to.endsWith(it))) {
    return false;
  }

  return chess
    .moves({ square: from, verbose: true })
    .map((it) => it.to)
    .includes(to);
}

export class Game {
  public gameId: string;
  public player1UserId: string;
  public player2UserId: string | null;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;
  private timer: NodeJS.Timeout | null = null;
  private player1Time: number = 10 * 60 * 1000;
  private player2Time: number = 10 * 60 * 1000;
  private gameStartTime: number = 0;
  private tempTime: number = 0;

  constructor(player1UserId: string, player2UserId: string | null) {
    this.player1UserId = player1UserId;
    this.player2UserId = player2UserId;
    this.board = new Chess();
    this.startTime = new Date();
    this.gameId = randomUUID();
  }

  async updateSecondPlayer(player2UserId: string) {
    this.player2UserId = player2UserId;

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [this.player1UserId, this.player2UserId],
        },
      },
    });

    try {
      await this.createGameInDb();
    } catch (error) {
      console.error(error);
      return;
    }

    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            name: users.find((user) => user.id === this.player1UserId)?.name,
            id: this.player1UserId,
          },
          blackPlayer: {
            name: users.find((user) => user.id === this.player2UserId)?.name,
            id: this.player2UserId,
          },
          fen: this.board.fen(),
          moves: [],
        },
      })
    );
    const time = new Date(Date.now()).getTime();
    this.gameStartTime = time;
    this.tempTime = time;
  }

  async createGameInDb() {
    const game = await prisma.game.create({
      data: {
        id: this.gameId,
        timeControl: "CLASSICAL",
        status: "IN_PROGRESS",
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whitePlayer: {
          connect: {
            id: this.player1UserId,
          },
        },
        blackPlayer: {
          connect: {
            id: this.player2UserId ?? "",
          },
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });
    this.gameId = game.id;
  }

  async addMoveToDb(move: { from: string; to: string }) {
    await prisma.$transaction([
      prisma.move.create({
        data: {
          gameId: this.gameId,
          moveNumber: this.moveCount + 1,
          from: move.from,
          to: move.to,
          // Todo: Fix start fen
          startFen: this.board.fen(),
          endFen: this.board.fen(),
          createdAt: new Date(Date.now()),
        },
      }),
      prisma.game.update({
        where: {
          id: this.gameId,
        },
        data: {
          currentFen: this.board.fen(),
        },
      }),
    ]);
  }

  async makeMove(user: User, move: { from: Square; to: Square }) {
    // Validation (is it this players turn, is the move valid)
    if (this.moveCount % 2 === 0 && user.userId !== this.player1UserId) {
      return;
    }

    if (this.moveCount % 2 === 1 && user.userId !== this.player2UserId) {
      return;
    }

    if (this.player1Time <= 0 || this.player2Time <= 0) {
      SocketManager.getInstance().broadcast(
        this.gameId,
        JSON.stringify({
          type: USER_TIMEOUT,
          payload: {
            win: this.player1Time <= 0 ? "BLACK_WINS" : "WHITE_WINS",
          },
        })
      );

      await prisma.game.update({
        where: {
          id: this.gameId,
        },
        data: {
          status: "COMPLETED",
          result: this.player1Time <= 0 ? "BLACK_WINS" : "WHITE_WINS",
        },
      });
    }

    try {
      if (isPromoting(this.board, move.from, move.to)) {
        this.board.move({
          from: move.from,
          to: move.to,
          promotion: "q",
        });
      } else {
        this.board.move({
          from: move.from,
          to: move.to,
        });
      }
    } catch (error) {
      console.log(error);
      return;
    }

    // add move to db
    await this.addMoveToDb(move);

    // update Timer
    this.updateUserTimer(user);

    // Send the update
    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: {
          move,
        },
      })
    );
    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: "GAME_TIME",
        payload: {
          player1UserId: this.player1UserId,
          player1Time: this.player1Time,
          player2UserId: this.player2UserId,
          player2Time: this.player2Time,
        },
      })
    );

    // Check if the game is over
    if (this.board.isGameOver()) {
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
          ? "WHITE_WINS"
          : "BLACK_WINS";

      SocketManager.getInstance().broadcast(
        this.gameId,
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            result,
          },
        })
      );

      await prisma.game.update({
        where: {
          id: this.gameId,
        },
        data: {
          result,
          status: "COMPLETED",
        },
      });
    }

    this.moveCount++;
  }

  async endGame() {
    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: USER_TIMEOUT,
        payload: {
          win: this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS",
        },
      })
    );
  }

  async setTimer(timer: NodeJS.Timeout) {
    this.timer = timer;
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }

  updateUserTimer(user: User) {
    const time = new Date(Date.now()).getTime();
    if (user.userId === this.player1UserId) {
      this.player1Time -= time - this.tempTime;
    } else {
      this.player2Time -= time - this.tempTime;
    }
    this.tempTime = time;
  }
}
