/* eslint-disable no-case-declarations */
import { useEffect, useState } from "react";
import MoveSound from "../../public/MoveSound.mp3";
import ChessBoard, { isPromoting } from "../Components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess, Square } from "chess.js";
import { useNavigate, useParams } from "react-router-dom";
import MoveTable from "../Components/MovesTable";
import { useUser } from "@repo/store/useUser";
import { UserAvatar } from "../Components/UserAvatar";

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

interface Metadata {
  blackPlayer: { id: string; name: string };
  whitePlayer: { id: string; name: string };
}

const moveAudio = new Audio(MoveSound);

export interface Move {
  from: Square;
  to: Square;
}

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
  const [result, setResult] = useState<
    | "WHITE_WINS"
    | "BLACK_WINS"
    | "DRAW"
    | typeof OPPONENT_DISCONNECTED
    | typeof USER_TIMEOUT
    | null
  >(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [myTimer, setMyTimer] = useState(10 * 60 * 1000);
  const [opponentTimer, setOpponentTimer] = useState(10 * 60 * 1000);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      console.log(message.type);

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
          const move = message.payload;
          const moves = chess.moves({ verbose: true });
          // TODO: fix later
          if (
            moves.map((x) => JSON.stringify(x)).includes(JSON.stringify(move))
          )
            return;
          if (isPromoting(chess, move.from, move.to)) {
            chess.move({
              from: move.from,
              to: move.to,
              promotion: "q",
            });
          } else {
            chess.move({ from: move.from, to: move.to });
          }
          moveAudio.play();
          setBoard(chess.board());
          setMoves((moves) => [...moves, move]);
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          break;
        case OPPONENT_DISCONNECTED:
          setResult(OPPONENT_DISCONNECTED);
          break;

        case USER_TIMEOUT:
          setResult(message.payload.win);
          break;

        case GAME_JOINED:
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setStarted(true);
          setMoves(message.payload.moves);
          message.payload.moves.map((x: Move) => {
            if (isPromoting(chess, x.from, x.to)) {
              chess.move({ ...x, promotion: "q" });
            } else {
              chess.move(x);
            }
          });
          setBoard(chess.board());
          break;
        case GAME_TIME:
          if (message.payload.player2UserId === user.id) {
            setMyTimer(message.payload.player2Time);
            setOpponentTimer(message.payload.player1Time);
          } else {
            setMyTimer(message.payload.player1Time);
            setOpponentTimer(message.payload.player2Time);
          }
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
        if (
          user.id === gameMetadata?.blackPlayer?.id ? "b" : "w" === chess.turn()
        ) {
          setMyTimer((myTimer) => myTimer - 100);
        } else {
          setOpponentTimer((opponentTimer) => opponentTimer - 100);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [started]);

  const getTimer = (tempTime: number) => {
    const minutes = Math.floor(tempTime / (1000 * 60));
    const remainingSeconds = Math.floor((tempTime % (1000 * 60)) / 1000);

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
    <div className="">
      {result && (
        <div className="justify-center flex pt-4 text-white">
          {result === "WHITE_WINS" && "White wins"}
          {result === "BLACK_WINS" && "Black wins"}
          {result === "DRAW" && "Draw"}
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
        <div className="pt-2 max-w-screen-lg w-full">
          <div className="grid grid-cols-7 gap-4 w-full">
            <div className="col-span-7 lg:col-span-5 w-full text-white">
              <div className="flex justify-center">
                <div>
                  <div className="mb-4 flex justify-between">
                    <UserAvatar name={gameMetadata?.blackPlayer?.name ?? ""} />
                    {getTimer(opponentTimer)}
                  </div>
                  <div>
                    <div
                      className={`col-span-4 w-full flex justify-center text-white ${(result === OPPONENT_DISCONNECTED || result === USER_TIMEOUT) && "pointer-events-none"}`}
                    >
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
                        setMoves={setMoves}
                        moves={moves}
                      />
                    </div>
                  </div>
                  <div className="mb-4 flex justify-between">
                    <UserAvatar name={gameMetadata?.blackPlayer?.name ?? ""} />
                    {getTimer(myTimer)}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 bg-gray-600 w-full rounded flex px-3 py-3">
              {!started && (
                <div className="pt-8">
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
              {moves.length > 0 && (
                <div className="w-full">
                  <MoveTable moves={moves} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
