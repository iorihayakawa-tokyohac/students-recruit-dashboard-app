import express from "express";
import { configureApp } from "../server/_core/app";

const app = express();
configureApp(app);

export default app;
