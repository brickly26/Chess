import WebSocket from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import { prisma } from "./db";
import { randomUUID } from "crypto";
import { SocketManager, User } from "./SocketManager";

export class Game {
  public gameId: string;
  public player1UserId: string;
  public player2UserId: string | null;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;

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

  async makeMove(user: User, move: { from: string; to: string }) {
    // Validation (is it this players turn, is the move valid)
    console.log("1", move);

    console.log(this.moveCount);

    if (this.moveCount % 2 === 0 && user.userId !== this.player1UserId) {
      return;
    }
    console.log("2", move);
    if (this.moveCount % 2 === 1 && user.userId !== this.player2UserId) {
      return;
    }
    console.log("3", move);

    try {
      this.board.move(move);
    } catch (error) {
      console.log(error);
      return;
    }

    console.log(move);

    // add move to db
    await this.addMoveToDb(move);

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
}
