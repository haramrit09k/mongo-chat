const mongo = require('mongodb').MongoClient;
const client = require('socket.io')(4242);

// mongo connection
mongo.connect("mongodb://127.0.0.1/mongo-chat", function(err, db){
    if(err){
        throw err;
    }

    console.log("Connection to DB established!");

    // connection to socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

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
            let msg = data.message;

            if(name == '' || msg == ''){
                sendStatus('Name or message missing!');
            }
            else{
                chat.insert({name: name, msg: msg}, function(){
                    client.emit('messages', [data]);

                    sendStatus({
                        message: 'Message successfully sent',
                        clear: true
                    });
                });
            }
        });

        socket.on('clear', function(data){
            chat.remove({}, function(){
                socket.emit('cleared');
            })
        });
    });
});