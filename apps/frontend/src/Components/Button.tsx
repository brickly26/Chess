import React from "react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="bg-[#B48764] text-2xl hover:bg-[#bf9b80] text-white font-bold py-4 px-8 rounded"
    >
      {children}
    </button>
  );
};

export default Button;
