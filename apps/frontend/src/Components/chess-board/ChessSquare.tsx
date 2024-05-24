import { Color, PieceSymbol, Square } from "chess.js";

const ChessSquare = ({
  square,
}: {
  square: {
    square: Square;
    type: PieceSymbol;
    color: Color;
  };
}) => {
  return (
    <div>
      {square ? (
        <img
          className="w-14"
          src={`/${square?.color === "b" ? `b${square.type}` : `w${square.type}`}.png`}
        />
      ) : null}
    </div>
  );
};

export default ChessSquare;