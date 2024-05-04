import { useNavigate } from "react-router-dom";
import Button from "../Components/Button";

const Landing = () => {
  const router = useNavigate();

  return (
    <div className="flex justify-center">
      <div className="pt-8 max-w-screen-lg">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="flex justify-center items-center">
            <img
              src={"/chessboard.jpeg"}
              alt="chessboard"
              className="max-w-96"
            />
          </div>
          <div className="flex justify-center flex-col">
            <h1 className="text-4xl font-bold text-white">Chess Online</h1>
            <p className="text-lg mt-2 text-white">
              Play chess with your friends
            </p>
            <div className="mt-8 flex space-x-5 justify-center">
              <Button onClick={() => router("/game/random")}>Play</Button>
              <Button onClick={() => router("/login")}>Login</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
