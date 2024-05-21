import "./App.css";
import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./Pages/Landing";
import Game from "./Pages/Game";
import Login from "./Pages/Login";
import { RecoilRoot } from "recoil";
import { Loader } from "./components/Loader";
import { Layout } from "./layout";

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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout children={<Landing />} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/game/:gameId" element={<Layout children={<Game />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
