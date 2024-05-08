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
export const OPPONENT_DISCONNECTED = "opponent_disconnected";

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
          chess.move(message.payload.move);
          setBoard(chess.board());
          setMoves((moves) => [...moves, message.payload.move]);
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          break;
        case OPPONENT_DISCONNECTED:
          setResult(message.payload.result);
          break;
      }
    };
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
                myColor={user.id === gameMetadata?.blackPlayer.id ? "b" : "w"}
                socket={socket}
                board={board}
                setBoard={setBoard}
                chess={chess}
                setMoves={setMoves}
                moves={moves}
              />
            </div>
            <div className="col-span-2 bg-gray-600 rounded flex justify-center items-center">
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
              <div>
                {moves.length > 0 && (
                  <div className="mt-4">
                    <MoveTable moves={moves} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
