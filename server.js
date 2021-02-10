const mongo = require('mongodb').MongoClient;
const socket = require('socket.io')(4242);

mongo.connect("mongodb://127.0.0.1/mongo-chat", function(err, db){
    if(err){
        throw err;
    }

    console.log("Connection to DB established!");
});