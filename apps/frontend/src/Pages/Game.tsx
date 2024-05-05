import { useEffect, useState } from "react";
import ChessBoard from "../Components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
import { useNavigate, useParams } from "react-router-dom";

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

interface Metadata {
  blackPlayer: string;
  whitePlayer: string;
}

const Game = () => {
  const socket = useSocket();
  const { gameId } = useParams();

  const router = useNavigate();

  // Todo move to store/context
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<"WHITE_WINS" | "BLACK_WINS" | "DRAW">(
    false
  );

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
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          console.log("Game over");
      }
    };
  }, [socket, chess]);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="">
      <div className="justify-center flex pt-4 text-white">
        {gameMetadata?.blackPlayer} vs {gameMetadata?.whitePlayer}
      </div>
      {result && (
        <div className="justify-center flex pt-4 text-white">{result}</div>
      )}
      <div className="flex justify-center">
        <div className="pt-8 max-w-screen-lg">
          <div className="grid grid-cols-6 gap-4 w-full">
            <div className="col-span-4 w-full flex justify-center">
              <ChessBoard
                socket={socket}
                board={board}
                setBoard={setBoard}
                chess={chess}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
