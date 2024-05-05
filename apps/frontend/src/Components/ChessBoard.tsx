import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../Pages/Game";
import MoveTable from "./MovesTable";

interface ChessBoardProps {
  socket: WebSocket;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  setBoard: React.Dispatch<
    React.SetStateAction<
      ({
        square: Square;
        type: PieceSymbol;
        color: Color;
      } | null)[][]
    >
  >;
  chess: Chess;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  socket,
  chess,
  setBoard,
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [moves, setMoves] = useState<{ from: Square; to: Square }[]>([]);
  const [validSquares, setValidSquares] = useState<[number, number][]>([]);

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    e.dataTransfer.setData("text/plain", square);
    setFrom(square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, to: Square) => {
    e.preventDefault();
    if (from) {
      socket.send(
        JSON.stringify({
          type: MOVE,
          payload: {
            move: {
              from,
              to,
            },
          },
        })
      );

      chess.move({
        from,
        to,
      });
      setBoard(chess.board());
      setFrom(null);
    }
  };

  const validMoves = (square: Square | null) => {
    const moves = chess.moves({ square: square! });

    const algebraicToIndices = (square: string): [number, number] => {
      let file: number, rank: number;

      if (square.length === 2) {
        file = square.charCodeAt(0) - "a".charCodeAt(0);
        rank = 8 - parseInt(square.substring(1));
      } else if (square.length === 3) {
        file = square.charCodeAt(1) - "a".charCodeAt(0);
        rank = 8 - parseInt(square.substring(2));
      } else {
        throw new Error("Invalid square notation");
      }

      return [rank, file];
    };

    const moveIndices = moves.map((move) => algebraicToIndices(move));
    setValidSquares(moveIndices);
  };

  return (
    <div className="flex">
      <div>
        {moves.length > 0 && (
          <div className="mt-4">
            <MoveTable moves={moves} />
          </div>
        )}
      </div>
      <div>
        {board.map((row, i) => {
          return (
            <div key={i} className="flex">
              {row.map((square, j) => {
                const squareCoord = (String.fromCharCode(97 + (j % 8)) +
                  "" +
                  (8 - i)) as Square;

                return (
                  <div
                    key={j}
                    className={`w-16 h-16 ${
                      (i + j) % 2 === 0 ? "bg-[#F0D8B5]" : "bg-[#B48764]"
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, squareCoord)}
                  >
                    <div className="w-full h-full flex justify-center items-center">
                      {validSquares.length > 0 ? (
                        <div
                          className={`${validSquares.some((square) => square[0] === i && square[1] === j) ? "bg-yellow-200 absolute p-2 flex justify-center items-center h-2 w-2 rounded-[50%]" : ""}`}
                        ></div>
                      ) : null}
                      <div
                        onClick={() => validMoves(square && square.square)}
                        className="h-full justify-center flex flex-col"
                      >
                        {square ? (
                          <img
                            className="w-10"
                            src={`/${
                              square?.color === "b"
                                ? square?.type
                                : `${square?.type?.toUpperCase()} copy`
                            }.png`}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, squareCoord)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChessBoard;
