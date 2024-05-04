import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../Pages/Game";

interface ChessBoardProps {
  color: string | null;
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
  color,
  board,
  socket,
  chess,
  setBoard,
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [to, setTo] = useState<null | Square>(null);

  return (
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
                  onClick={() => {
                    if (!from) {
                      setFrom(squareCoord);
                    } else if (!to) {
                      setTo(squareCoord);
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
                      setFrom(null);
                      setTo(null);

                      console.log({
                        from,
                        to: squareCoord,
                      });
                    }
                  }}
                >
                  <div className="w-full h-full flex justify-center items-center">
                    {square ? (
                      <img
                        className="w-10"
                        src={`/${
                          square?.color === "b"
                            ? square?.type
                            : `${square?.type?.toUpperCase()} copy`
                        }.png`}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ChessBoard;
