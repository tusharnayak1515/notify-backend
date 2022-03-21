const path = require("path");
require('dotenv').config({path: path.resolve(__dirname,'./.env')});
const express = require("express");
const cors = require("cors");
const connectToMongo = require('./db');

const app = express();
app.use(express.json());
app.use(cors());
connectToMongo();
const port = 5000;

app.use('/api/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/todo'));

app.get("/",(req,res)=> {
    res.json("Hello");
})

app.listen(port,()=> {
    console.log(`Server is running on port ${port}`);
})