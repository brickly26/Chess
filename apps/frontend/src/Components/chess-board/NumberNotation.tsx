const NumberNotation = ({
  label,
  isMainBoxColor,
}: {
  label: string;
  isMainBoxColor: boolean;
}) => {
  return (
    <div
      className={`font-bold absolute ${isMainBoxColor ? "text-[#B48764]" : "text-[#F0D8B5]"} left-0.5`}
    >
      {label}
    </div>
  );
};

export default NumberNotation;
