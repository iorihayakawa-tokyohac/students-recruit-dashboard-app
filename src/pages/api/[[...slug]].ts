import express from "express";
import { configureApp } from "../../../server/_core/app";

const app = express();
configureApp(app);

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default app;
