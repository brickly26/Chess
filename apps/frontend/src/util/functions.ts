import { Color } from "chess.js";

export const algebraicToIndices = (
  square: string,
  color: Color
): [number, number] => {
  let file: number, rank: number;

  if (square === "O-O") {
    if (color === "b") {
      return [0, 6];
    } else {
      return [7, 6];
    }
  }

  if (square === "O-O-O") {
    if (color === "b") {
      return [0, 2];
    } else {
      return [7, 2];
    }
  }

  if (square.length === 2) {
    file = square.charCodeAt(0) - "a".charCodeAt(0);
    rank = 8 - parseInt(square.substring(1));
  } else if (square.length === 3) {
    file = square.charCodeAt(1) - "a".charCodeAt(0);
    rank = 8 - parseInt(square.substring(2));
  } else if (square.length === 4) {
    if (square[3] === "+") {
      file = square.charCodeAt(1) - "a".charCodeAt(0);
      rank = 8 - parseInt(square.substring(2));
    } else {
      file = square.charCodeAt(2) - "a".charCodeAt(0);
      rank = 8 - parseInt(square.substring(3));
    }
  } else if (square.length === 5) {
    file = square.charCodeAt(2) - "a".charCodeAt(0);
    rank = 8 - parseInt(square.substring(3));
  } else {
    throw new Error("Invalid square notation");
  }

  return [rank, file];
};

export function isArrayInNestedArray(
  nestedArray: number[][],
  targetArray: number[]
) {
  return nestedArray.some((array) => {
    if (Array.isArray(array) && array.length === targetArray.length) {
      return array.every((element, index) => element === targetArray[index]);
    }
    return false;
  });
}
