// set up basic express routing
const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static("express"));
// default URL for website
app.use('/', function(req,res){
    res.sendFile(path.join(__dirname+'/index.html'));
    //__dirname : It will resolve to your project folder.
  });
const server = http.createServer(app);
const port = process.env.PORT || 4242;
server.listen(port);
console.debug('Server listening on port ' + port);

// setup mongo and socket.io
const mongo = require('mongodb').MongoClient;
const client = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:4242",
      methods: ["GET", "POST"],
      credentials: true,
      transports: ['websocket', 'polling'],
    }  
});

if(process.env.NODE_ENV === "production"){
    var uri = process.env.MONGODB_URI;
}
else{
    var uri = "mongodb://127.0.0.1/mangochat-messages";
}

// mongo connection
mongo.connect(uri, function(err, db){
    if(err){
        throw err;
    }
    else{
        console.log("Connection to DB established!");
        console.log(uri);
    }

    // connection to socket.io
    client.on('connection', function(socket){
        let mangochat = db.db('mangochat-messages');
        let chat = mangochat.collection('chat');

        // send status across n/w
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        // fetch chats from db
        chat.find().limit(100).sort({_id:1}).toArray(function(err, response){
            if(err){
                throw err;
            }

            socket.emit('messages', response);
        });

        socket.on('input', function(data){
            let name = data.name;
            let msg = data.msg;
            if(name == '' || msg == ''){
                sendStatus('Name or message missing!');
            }
            else{
                // insert chat in collection
                chat.insertOne({name: name, msg: msg}, function(){
                   // emit messages to all users
                    client.emit('messages', {name: name, msg: msg});
                    sendStatus({
                        message: 'Message successfully sent',
                        clear: true
                    });
                });
            }
        });

        socket.on('clear', function(data){
            chat.drop(function(){
                socket.emit('cleared');
            })
        });
    });
});