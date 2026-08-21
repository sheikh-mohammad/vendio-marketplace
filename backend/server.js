import express from "express";
import mongoose from "mongoose"
import cors from "cors";
import {setServers} from "node:dns/promises"

const app = express()