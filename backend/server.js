import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { setServers } from "node:dns/promises";
import dotenv from "dotenv"

dotenv.config
const app = express();

app.use(express.json());
app.use(cors());

