const path = require("path");
require('dotenv').config({path: path.resolve(__dirname,'./.env')});
const express = require("express");
const cors = require("cors");
const connectToMongo = require('./db');

const app = express();
connectToMongo();
const port = 3001;

app.get("/",(req,res)=> {
    res.json("Hello");
})

app.listen(port,()=> {
    console.log(`Server is running on port ${port}`);
})