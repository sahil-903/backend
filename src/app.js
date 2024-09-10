import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import exp from "constants";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json( {
    limit: "16kb"
}))

app.use(express.urlencoded ( {
    extended:true,
    limit: "1kb"
}))

app.use(cookieParser());
app.use(express.static("public"));

// routes
import userRouter from './routes/user.routes.js'

// routes declaratiom
// for ex: https://localhost:8000/api/v1/users/register
app.use("/api/v1/users", userRouter)
export { app }