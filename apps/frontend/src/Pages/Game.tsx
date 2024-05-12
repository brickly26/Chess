/* eslint-disable no-case-declarations */
import { useEffect, useState } from "react";
import ChessBoard from "../Components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess, Square } from "chess.js";
import { useNavigate, useParams } from "react-router-dom";
import MoveTable from "../Components/MovesTable";
import { useUser } from "@repo/store/useUser";

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const JOIN_GAME = "join_game";
export const OPPONENT_DISCONNECTED = "opponent_disconnected";
export const JOIN_ROOM = "join_room";
export const GAME_JOINED = "game_joined";

interface Metadata {
  blackPlayer: { id: string; name: string };
  whitePlayer: { id: string; name: string };
}

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
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<
    "WHITE_WINS" | "BLACK_WINS" | "DRAW" | typeof OPPONENT_DISCONNECTED | null
  >(null);
  const [moves, setMoves] = useState<Move[]>([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      console.log(message.type);

      switch (message.type) {
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
          const move = message.payload.move;
          const moves = chess.moves({ verbose: true });
          // TODO: fix later
          if (
            moves.map((x) => JSON.stringify(x)).includes(JSON.stringify(move))
          )
            return;
          chess.move(move);
          setBoard(chess.board());
          setMoves((moves) => [...moves, move]);
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          break;
        case OPPONENT_DISCONNECTED:
          setResult(OPPONENT_DISCONNECTED);
          break;
        case GAME_JOINED:
          console.log(message.payload);
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setStarted(true);
          setMoves(message.payload.moves);
          message.payload.moves.map((x) => chess.move(x));
          setBoard(chess.board());
          break;
      }
    };

    if (gameId !== "random") {
      socket.send(
        JSON.stringify({
          type: JOIN_GAME,
          payload: {
            gameId,
          },
        })
      );
    }
  }, [socket, chess]);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="">
      <div className="justify-center flex pt-4 text-white">
        {gameMetadata?.blackPlayer.name} vs {gameMetadata?.whitePlayer.name}
      </div>
      {result && (
        <div className="justify-center flex pt-4 text-white">{result}</div>
      )}
      <div className="flex justify-center">
        <div className="pt-8 max-w-screen-lg">
          <div className="grid grid-cols-6 gap-4 w-full">
            <div className="col-span-4 w-full flex justify-center">
              <ChessBoard
                gameId={gameId ?? ""}
                myColor={user.id === gameMetadata?.blackPlayer.id ? "b" : "w"}
                socket={socket}
                board={board}
                setBoard={setBoard}
                chess={chess}
                setMoves={setMoves}
                moves={moves}
              />
            </div>
            <div className="col-span-2 bg-gray-600 rounded flex px-3 py-3">
              {!started && gameId === "random" && (
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
