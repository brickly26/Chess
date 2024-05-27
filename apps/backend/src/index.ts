import express from "express";
import cors from "cors";
import { initPassport } from "./passport";
import passport from "passport";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";

import authRoute from "./router/auth";
import v1Router from "./router/v1";

export const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

const app = express();

dotenv.config();

app.use(express.json());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: COOKIE_MAX_AGE },
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
