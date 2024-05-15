const LetterNotation = ({
  label,
  isMainBoxColor,
}: {
  label: string;
  isMainBoxColor: boolean;
}) => {
  return (
    <div
      className={`font-bold absolute ${isMainBoxColor ? "text-[#B48764]" : "text-[#F0D8B5]"} right-0.5 bottom-0`}
    >
      {label}
    </div>
  );
};

export default LetterNotation;
