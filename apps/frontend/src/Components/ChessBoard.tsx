/* eslint-disable react-refresh/only-export-components */
import { Chess, Color, Move, PieceSymbol, Square } from "chess.js";
import { useState, MouseEvent, memo, useEffect } from "react";
import { MOVE } from "../Pages/Game";
import useWindowSize from "../hooks/useWindowSize";
import MoveSound from "/MoveSound.mp3";
import CaptureSound from "/capture.wav";
import { drawArrow } from "../util/canvas";
import NumberNotation from "./chess-board/NumberNotation";
import LetterNotation from "./chess-board/LetterNotation";
import LegalMoveIndicator from "./chess-board/LegalMoveIndicator";
import Confetti from "react-confetti";

export const isPromoting = (chess: Chess, from: Square, to: Square) => {
  if (!from) {
    return false;
  }

  const piece = chess.get(from);

  if (piece?.type !== "p") {
    return false;
  }

  if (piece.color !== chess.turn()) {
    return false;
  }

  if (!["1", "8"].some((it) => to.endsWith(it))) {
    return false;
  }

  return chess
    .moves({ square: from, verbose: true })
    .map((it) => it.to)
    .includes(to);
};

interface ChessBoardProps {
  myColor: Color;
  gameId: string;
  started: boolean;
  chess: Chess;
  // moves: Move[];
  // setMoves: React.Dispatch<React.SetStateAction<Move[]>>;
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
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  started,
  gameId,
  myColor,
  board,
  socket,
  chess,
  setBoard,
  // setMoves,
  // moves,
}) => {
  const { height, width } = useWindowSize();
  const [lastMoveFrom, lastMoveTo] = [
    moves?.at(-1)?.from || "",
    moves?.at(-1)?.to || "",
  ];
  const [rightClickedSquares, setRightClickedSquares] = useState<string[]>([]);
  const [arrowStart, setArrowStart] = useState<string | null>(null);

  const [from, setFrom] = useState<null | Square>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const isMyTurn = myColor === chess.turn();

  const labels = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const isFlipped = myColor === "b";
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const OFFSET = 100;
  const boxSize =
    width > height
      ? Math.floor((height - OFFSET) / 8)
      : Math.floor((width - OFFSET) / 8);
  const [gameOver, setGameOver] = useState(false);
  const moveAudio = new Audio(MoveSound);
  const captureAudio = new Audio(CaptureSound);

  const handleMouseDown = (
    e: MouseEvent<HTMLDivElement>,
    squareRep: string
  ) => {
    e.preventDefault();
    if (e.button === 2) {
      setArrowStart(squareRep);
    }
  };

  const clearCanvas = () => {
    setRightClickedSquares([]);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleRightClick = (squareRep: string) => {
    if (rightClickedSquares.includes(squareRep)) {
      setRightClickedSquares((prev) => prev.filter((sq) => sq !== squareRep));
    } else {
      setRightClickedSquares((prev) => [...prev, squareRep]);
    }
  };

  const handleDrawArrow = (squareRep: string) => {
    if (arrowStart) {
      const stoppedAtSquare = squareRep;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawArrow(ctx, arrowStart, stoppedAtSquare, isFlipped);
        }
      }
      setArrowStart(null);
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>, squareRep: string) => {
    e.preventDefault();
    if (!started) {
      return;
    }
    if (e.button === 2) {
      if (arrowStart === squareRep) {
        handleRightClick(squareRep);
      } else {
        handleDrawArrow(squareRep);
      }
    } else {
      clearCanvas();
    }
  };

  // const handleDragStart = (
  //   e: React.DragEvent,
  //   square: Square,
  //   pieceColor: Color
  // ) => {
  //   e.dataTransfer.setData("text/plain", square);
  //   if (!isMyTurn) return;
  //   if (pieceColor !== chess.turn()) return;
  //   setLegalMoves(
  //     chess
  //       .moves({
  //         verbose: true,
  //         square: square,
  //       })
  //       .map((move) => move.to)
  //   );
  //   setFrom(square);
  // };

  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault();
  // };

  // const handleDrop = (e: React.DragEvent, to: Square) => {
  //   e.preventDefault();

  //   const square = algebraicToIndices(to, chess.turn());

  //   const isValidMove = isArrayInNestedArray(validSquares, square);

  //   if (from && isValidMove) {
  //     socket.send(
  //       JSON.stringify({
  //         type: MOVE,
  //         payload: {
  //           move: {
  //             from,
  //             to,
  //           },
  //         },
  //       })
  //     );

  //     chess.move({
  //       from,
  //       to,
  //     });
  //     setBoard(chess.board());
  //     setMoves([...moves, { from, to }]);
  //   }
  //   setFrom(null);
  //   setValidSquares([]);
  // };

  // const validMoves = (square: Square | null) => {
  //   const moves = chess.moves({ square: square! });

  //   console.log(chess.moves({ square: square! }));

  //   const moveIndices = moves.map((move) =>
  //     algebraicToIndices(move, chess.turn())
  //   );
  //   setValidSquares(moveIndices);
  // };

  console.log("from", from);
  console.log("legalMoves", legalMoves);

  return (
    <>
      {gameOver && <Confetti />}
      <div className="flex relative">
        <div className="text-white-200 mr-10 rounded-md overflow-hidden">
          {(isFlipped ? board.slice().reverse() : board).map((row, i) => {
            i = isFlipped ? i + 1 : 8 - i;
            return (
              <div key={i} className="flex relative">
                <NumberNotation
                  isMainBoxColor={i % 2 === 0}
                  label={i.toString()}
                />
                {(isFlipped ? row.slice().reverse() : row).map((square, j) => {
                  j = isFlipped ? 7 - (j % 8) : j % 8;

                  const isMainBoxColor = isFlipped
                    ? (i + j) % 2 === 0
                    : (i + j) % 2 !== 0;

                  const squareRepresentation = (String.fromCharCode(97 + j) +
                    "" +
                    i) as Square;

                  const isHighlightedSquare =
                    from === squareRepresentation ||
                    squareRepresentation === lastMoveFrom ||
                    squareRepresentation === lastMoveTo;
                  const isRightClickedSquare =
                    rightClickedSquares.includes(squareRepresentation);

                  return (
                    <div
                      key={j}
                      style={{ width: boxSize, height: boxSize }}
                      className={`${isRightClickedSquare ? (isMainBoxColor ? "bg-[#CF664E]" : "bg-[#E87764]") : isHighlightedSquare ? `${isMainBoxColor ? "bg-[#BBCB45]" : "bg-[#F4F687]"}` : isMainBoxColor ? "bg-[#B48764]" : "bg-[#F0D8B5]"} ${""}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                      }}
                      onMouseDown={(e) => {
                        handleMouseDown(e, squareRepresentation);
                      }}
                      onMouseUp={(e) => {
                        handleMouseUp(e, squareRepresentation);
                      }}
                      // onDragOver={handleDragOver}
                      // onDrop={(e) => handleDrop(e, squareRepresentation)}
                      onClick={() => {
                        if (!started) {
                          return;
                        }
                        if (!from && square?.color !== chess.turn()) return;
                        if (!isMyTurn) return;
                        if (from === squareRepresentation) {
                          setFrom(null);
                          setLegalMoves([]);
                        }

                        if (!from) {
                          setLegalMoves(
                            chess
                              .moves({
                                verbose: true,
                                square: square?.square,
                              })
                              .map((move) => move.to)
                          );
                          setFrom(squareRepresentation);
                        } else {
                          try {
                            let moveResult;
                            if (
                              isPromoting(chess, from, squareRepresentation)
                            ) {
                              moveResult = chess.move({
                                from,
                                to: squareRepresentation,
                                promotion: "q",
                              });
                            } else {
                              moveResult = chess.move({
                                from,
                                to: squareRepresentation,
                              });
                            }

                            if (moveResult) {
                              moveAudio.play();
                              if (moveResult.captured) {
                                captureAudio.play();
                              }
                              if (moveResult.san.includes("#")) {
                                setGameOver(true);
                              }
                            }

                            socket.send(
                              JSON.stringify({
                                type: MOVE,
                                payload: {
                                  gameId,
                                  move: {
                                    from,
                                    to: squareRepresentation,
                                  },
                                },
                              })
                            );

                            setFrom(null);
                            setLegalMoves([]);
                            setBoard(chess.board());
                            setMoves((moves) => [
                              ...moves,
                              { from, to: squareRepresentation },
                            ]);
                          } catch (error) {
                            console.log("");
                          }
                        }
                      }}
                    >
                      <div className="w-full justify-center flex h-full relative">
                        {square && (
                          <div className="h-full justify-center flex flex-col">
                            {square ? (
                              <img
                                className="w-14"
                                src={`/${square?.color === "b" ? `b${square.type}` : `w${square.type}`}.png`}
                                alt=""
                                // draggable={true}
                                // onDragStart={(e) =>
                                //   handleDragStart(
                                //     e,
                                //     square.square,
                                //     square.color
                                //   )
                                // }
                              />
                            ) : null}
                          </div>
                        )}
                        {isFlipped
                          ? i === 8 && (
                              <LetterNotation
                                label={labels[j]}
                                isMainBoxColor={j % 2 !== 0}
                              />
                            )
                          : i === 1 && (
                              <LetterNotation
                                label={labels[j]}
                                isMainBoxColor={j % 2 !== 0}
                              />
                            )}
                        {!!from &&
                          legalMoves.includes(squareRepresentation) && (
                            <LegalMoveIndicator
                              isMainBoxColor={isMainBoxColor}
                              isPiece={!!square?.type}
                            />
                          )}
                        {/* <div
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
                        </div> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <canvas
          ref={(ref) => setCanvas(ref)}
          width={boxSize * 8}
          height={boxSize * 8}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
        ></canvas>
      </div>
    </>
  );
};

export default ChessBoard;
