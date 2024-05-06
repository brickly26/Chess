import "./App.css";
import { Suspense } from "react";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./Pages/Landing";
import Game from "./Pages/Game";
import Login from "./Pages/Login";
import { RecoilRoot } from "recoil";
import { useUser } from "@repo/store/useUser";
import { Loader } from "./Components/Loader";

function App() {
  return (
    <div className="h-screen bg-gray-800">
      <RecoilRoot>
        <Suspense fallback={<Loader />}>
          <AuthApp />
        </Suspense>
      </RecoilRoot>
    </div>
  );
}

function AuthApp() {
  const user = useUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Game /> : <Login />} />
        <Route path="/game/:gameId" element={user ? <Game /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
