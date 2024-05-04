import express from "express";
import cors from "cors";
import { initPassport } from "./passport";
import passport from "passport";
import dotenv from "dotenv";
import session from "express-session";

import authRoute from "./router/auth";
import v1Router from "./router/v1";

const app = express();

dotenv.config();

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 360000 },
  })
);

initPassport();
app.use(passport.initialize());
app.use(passport.authenticate("session"));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELET",
    credentials: true,
  })
);

app.use("/auth", authRoute);
app.use("/v1", v1Router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
