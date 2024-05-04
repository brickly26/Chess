import "./App.css";
import { useEffect, useState } from "react";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./Pages/Landing";
import Game from "./Pages/Game";
import Login from "./Pages/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/auth/login/refresh",
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          setIsAuthenticated(true);
          localStorage.setItem("token", (await response.json()).token);
        } else {
          throw new Error("Authentication failed");
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchToken();
  }, []);

  return (
    <div className="h-screen bg-gray-800">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Game /> : <Login />}
          />
          <Route
            path="/game"
            element={isAuthenticated ? <Game /> : <Login />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
