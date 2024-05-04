import { Color, PieceSymbol, Square } from "chess.js";

interface ChessBoardProps {
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
}

const ChessBoard: React.FC<ChessBoardProps> = ({ board }) => {
  return (
    <div className="">
      {board.map((row, i) => {
        return (
          <div key={i} className="flex">
            {row.map((square, j) => {
              return (
                <div
                  key={j}
                  className={`w-16 h-16 ${
                    (i + j) % 2 === 0 ? "bg-[#F0D8B5]" : "bg-[#B48764]"
                  }`}
                >
                  <div className="w-full h-full flex justify-center items-center">
                    {square ? square.type : ""}
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
