import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE, Move } from "../Pages/Game";
import { algebraicToIndices, isArrayInNestedArray } from "../util/functions";

interface ChessBoardProps {
  myColor: Color;
  moves: Move[];
  setMoves: React.Dispatch<React.SetStateAction<Move[]>>;
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
  myColor,
  board,
  socket,
  chess,
  setBoard,
  setMoves,
  moves,
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [validSquares, setValidSquares] = useState<[number, number][]>([]);
  const isMyTurn = myColor === chess.turn();

  const handleDragStart = (
    e: React.DragEvent,
    square: Square,
    pieceColor: Color
  ) => {
    e.dataTransfer.setData("text/plain", square);
    if (!isMyTurn) return;
    if (pieceColor !== chess.turn()) return;
    validMoves(square);
    setFrom(square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, to: Square) => {
    e.preventDefault();

    const square = algebraicToIndices(to);

    const isValidMove = isArrayInNestedArray(validSquares, square);

    if (from && isValidMove) {
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
      setMoves([...moves, { from, to }]);
    }
    setFrom(null);
    setValidSquares([]);
  };

  const validMoves = (square: Square | null) => {
    const moves = chess.moves({ square: square! });

    const moveIndices = moves.map((move) => algebraicToIndices(move));
    setValidSquares(moveIndices);
  };

  return (
    <div className="flex">
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
                    onClick={() => {
                      console.log("click", [i, j]);
                      if (square?.color !== chess.turn()) return;
                      if (!isMyTurn) return;
                      if (!from) {
                        validMoves(square && square.square);
                        setFrom(squareCoord);
                      } else {
                        try {
                          if (isArrayInNestedArray(validSquares, [i, j])) {
                            socket.send(
                              JSON.stringify({
                                type: MOVE,
                                payload: {
                                  move: {
                                    from,
                                    to: squareCoord,
                                  },
                                },
                              })
                            );

                            chess.move({
                              from,
                              to: squareCoord,
                            });
                            setBoard(chess.board());
                            setMoves([...moves, { from, to: squareCoord }]);
                          }

                          setFrom(null);
                          setValidSquares([]);
                        } catch (error) {
                          console.log("");
                        }
                      }
                    }}
                  >
                    <div
                      className={`w-full h-full flex justify-center items-center ${square ? "cursor-pointer" : ""} ${validSquares.some((square) => square[0] === i && square[1] === j) ? "cursor-pointer" : ""}`}
                    >
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
                            onDragStart={(e) =>
                              handleDragStart(e, square.square, square.color)
                            }
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
