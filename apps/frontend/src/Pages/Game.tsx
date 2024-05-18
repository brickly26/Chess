/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import MoveSound from "/MoveSound.mp3";
import ChessBoard, { isPromoting } from "../Components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess, Move } from "chess.js";
import { useNavigate, useParams } from "react-router-dom";
import MoveTable from "../Components/MovesTable";
import { useUser } from "@repo/store/useUser";
import { UserAvatar } from "../Components/UserAvatar";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { movesAtom, userSelectedMoveIndexAtom } from "@repo/store/chessBoard";

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const OPPONENT_DISCONNECTED = "opponent_disconnected";
export const GAME_OVER = "game_over";
export const JOIN_ROOM = "join_room";
export const GAME_JOINED = "game_joined";
export const GAME_ALERT = "game_alert";
export const GAME_ADDED = "game_added";
export const USER_TIMEOUT = "user_timeout";
export const GAME_TIME = "game_time";
export const GAME_ENDED = "game_ended";

export enum Result {
  WHITE_WINS = "WHITE_WINS",
  BLACK_WINS = "BLACK_WINS",
  DRAW = "DRAW",
}

export interface GameResult {
  result: Result;
  by: string;
}

const GAME_TIME_MS = 10 * 60 * 1000;

interface Metadata {
  blackPlayer: { id: string; name: string };
  whitePlayer: { id: string; name: string };
}

const moveAudio = new Audio(MoveSound);

const Game = () => {
  const socket = useSocket();
  const { gameId } = useParams();
  const user = useUser();

  const router = useNavigate();

  // Todo move to store/context
  const [chess, _setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [added, setAdded] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState(0);

  const setMoves = useSetRecoilState(movesAtom);
  const userSelectedMoveIndex = useRecoilValue(userSelectedMoveIndexAtom);
  const userSelectedMoveIndexRef = useRef(userSelectedMoveIndex);

  useEffect(() => {
    userSelectedMoveIndexRef.current = userSelectedMoveIndex;
  }, [userSelectedMoveIndex]);

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
    }
  }, [user]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case GAME_ADDED:
          setAdded(true);
          break;
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          router(`/game/${message.payload.gameId}`);
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          break;
        case MOVE:
          const { move, player1TimeConsumed, player2TimeConsumed } =
            message.payload;
          setPlayer1TimeConsumed(player1TimeConsumed),
            setPlayer2TimeConsumed(player2TimeConsumed);

          if (userSelectedMoveIndexRef.current !== null) {
            setMoves((moves) => [...moves, move]);
            return;
          }

          try {
            if (isPromoting(chess, move.from, move.to)) {
              chess.move({
                from: move.from,
                to: move.to,
                promotion: "q",
              });
            } else {
              chess.move({ from: move.from, to: move.to });
            }
            setMoves((moves) => [...moves, move]);
            moveAudio.play();
          } catch (error) {
            console.log("Error", error);
          }
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          break;

        case GAME_ENDED:
          const wonBy =
            message.payload.status === "COMPLETED"
              ? message.payload.result !== "DRAW"
                ? "CheckMate"
                : "Draw"
              : "Timeout";
          setResult({
            result: message.payload.result,
            by: wonBy,
          });
          chess.reset();
          setMoves(() => {
            message.payload.moves.map((curr_move: Move) => {
              chess.move(curr_move as Move);
            });
            return message.payload.moves;
          });
          setGameMetadata({
            blackPlayer: message.player.blackPlayer,
            whitePlayer: message.player.whitePlayer,
          });
          break;

        case USER_TIMEOUT:
          setResult(message.payload.win);
          break;

        case GAME_JOINED:
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
          setPlayer2TimeConsumed(message.payload.player2TimeConsumed);
          console.log(message.payload);
          setStarted(true);

          message.payload.moves.map((x: Move) => {
            if (isPromoting(chess, x.from, x.to)) {
              chess.move({ ...x, promotion: "q" });
            } else {
              chess.move(x);
            }
          });
          setMoves(message.payload.moves);
          break;

        case GAME_TIME:
          setPlayer1TimeConsumed(message.payload.player1Time);
          setPlayer2TimeConsumed(message.payload.player2Time);
          break;
        default:
          alert(message.payload.message);
          break;
      }
    };

    if (gameId !== "random") {
      socket.send(
        JSON.stringify({
          type: JOIN_ROOM,
          payload: {
            gameId,
          },
        })
      );
    }
  }, [socket, chess]);

  useEffect(() => {
    if (started) {
      const interval = setInterval(() => {
        if (chess.turn() === "w") {
          setPlayer1TimeConsumed((p) => p + 100);
        } else {
          setPlayer2TimeConsumed((p) => p + 100);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [started, gameMetadata, user]);

  const getTimer = (timeConsumed: number) => {
    const timeLeftMs = GAME_TIME_MS - timeConsumed;
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const remainingSeconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    return (
      <div className="text-white">
        Time Left: {minutes < 10 ? "0" : ""}
        {minutes}:{remainingSeconds < 10 ? "0" : ""}
        {remainingSeconds}
      </div>
    );
  };

  if (!socket) return <div>Connecting...</div>;

  return (
    // TODO: create a end Game modal here
    <div className="">
      {result && (
        <div className="justify-center flex pt-4 text-white">
          {result.by === "WHITE_WINS" && "White wins"}
          {result.by === "BLACK_WINS" && "Black wins"}
          {result.by === "DRAW" && "Draw"}
        </div>
      )}

      {started && (
        <div className="justify-center flex pt-4 text-white">
          {(user.id === gameMetadata?.blackPlayer?.id ? "b" : "w") ===
          chess.turn()
            ? "Your turn"
            : "Opponent's turn"}
        </div>
      )}
      <div className="flex justify-center">
        <div className="pt-2 w-full">
          <div className="flex flex-wrap justify-around content-around w-full">
            <div className="text-white">
              <div className="flex justify-center">
                <div>
                  <div className="mb-4">
                    {started && (
                      <div>
                        <UserAvatar
                          name={
                            user.id === gameMetadata?.whitePlayer?.id
                              ? gameMetadata?.blackPlayer?.name
                              : gameMetadata?.whitePlayer?.name ?? ""
                          }
                        />
                        {getTimer(
                          user.id === gameMetadata?.whitePlayer?.id
                            ? player2TimeConsumed
                            : player1TimeConsumed
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={`w-full flex justify-center text-white`}>
                      <ChessBoard
                        started={started}
                        gameId={gameId ?? ""}
                        myColor={
                          user.id === gameMetadata?.blackPlayer.id ? "b" : "w"
                        }
                        socket={socket}
                        board={board}
                        setBoard={setBoard}
                        chess={chess}
                      />
                    </div>
                  </div>
                  {started && (
                    <div className="mb-4 flex justify-between">
                      <UserAvatar
                        name={
                          user.id === gameMetadata?.blackPlayer?.id
                            ? gameMetadata?.blackPlayer?.name
                            : gameMetadata?.whitePlayer?.name ?? ""
                        }
                      />
                      {getTimer(
                        user.id === gameMetadata?.blackPlayer?.id
                          ? player2TimeConsumed
                          : player1TimeConsumed
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md bg-gray-600 overflow-auto h-[90vh] mt-10">
              {!started && (
                <div className="pt-8 flex justify-center w-full">
                  {added ? (
                    <div>waiting...</div>
                  ) : (
                    gameId === "random" && (
                      <button
                        className="bg-[#B48764] text-2xl hover:bg-[#bf9b80] text-white font-bold py-4 w-full mx-4 rounded"
                        onClick={() => {
                          setStarted(true);
                          socket.send(
                            JSON.stringify({
                              type: INIT_GAME,
                            })
                          );
                        }}
                      >
                        Play
                      </button>
                    )
                  )}
                </div>
              )}
              <div>
                <MoveTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
