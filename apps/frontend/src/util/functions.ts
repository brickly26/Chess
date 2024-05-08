export const algebraicToIndices = (square: string): [number, number] => {
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
