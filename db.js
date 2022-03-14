const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const connectToMongo = ()=> {
    try {
        mongoose.connect(mongoURI, ()=> {
            console.log("Connected to mongodb successfully!");
        })
    }
    catch(error) {
        console.log(error);
    }
};

module.exports = connectToMongo;