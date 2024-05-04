const Landing = () => {
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
            <div className="mt-4">
              <button className="bg-[#B48764] text-2xl hover:bg-[#bf9b80] text-white font-bold py-4 px-8 rounded">
                Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
