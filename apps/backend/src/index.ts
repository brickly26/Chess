import express from "express";
const cookieSession = require("cookie-session");
const cors = require("cors");
const passport = require("passprt");
import dotenv from "dotenv";

import authRoute from "./router/auth";
import v1Router from "./router/v1";

const app = express();

dotenv.config();

app.use(
  cookieSession({
    name: "session",
    keys: ["lama"],
    maxAge: 24 * 60 * 60 * 100,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "http://localhost:5173/",
    methods: "GET,POST,PUT,DELET",
    credetials: true,
  })
);

app.use("/auth", authRoute);
app.use("/v1", v1Router);

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
