var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var axios = require('axios');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('*',function(req,res){
    res.sendFile(path.join(__dirname + '/index.html'))
});

// //Whenever someone connects this gets executed
// io.on('connection', function(socket) {
//     console.log('A user connected');

//     // //Send a message after a timeout of 4seconds
//     // setTimeout(function() {
//     //     socket.send('Sent a message 4seconds after connection!');
//     // }, 4000);

//     //Send a message when 
//     setTimeout(function() {
//         //Sending an object when emmiting an event
//         socket.emit('testerEvent', { description: 'A custom event named testerEvent!'});
//     }, 4000);

//     socket.on('clientEvent', function(data) {
//         console.log(data);
//      });
    
//     //Whenever someone disconnects this piece of code executed
//     socket.on('disconnect', function () {
//        console.log('A user disconnected');
//     });
//  });

/** Brodcase message to evrey connected client */
// var clients = 0;
// io.on('connection', function(socket) {
//     console.log('Client Connected');
//     clients++;
//     io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
//     socket.on('disconnect', function () {
//         console.log('Client Disconnected');
//         clients--;
//         io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
//     });
// });

/** Brodcase message to evrey connected client except the client that emited the event */
// var clients = 0;
// io.on('connection', function(socket) {
//    clients++;
//    socket.emit('newclientconnect',{ description: 'Hey, welcome!'});
//    socket.broadcast.emit('newclientconnect',{ description: clients + ' clients connected!'})
//    socket.on('disconnect', function () {
//       clients--;
//       socket.broadcast.emit('newclientconnect',{ description: clients + ' clients connected!'})
//    });
// });

/** Namespacing */
// var nsp = io.of('/my-namespace');
// nsp.on('connection', function(socket) {
//    console.log('someone connected');
//    nsp.emit('hi', 'Hello everyone!');
// });

/** Connect to rooms */
// var roomno = 1;
// io.on('connection', function(socket) {

//    //Increase roomno if 2 clients are present in a room.
//    if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) roomno++;
//    socket.join("room-"+roomno);

//    //Send this event to everyone in the room.
//    io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);
//     socket.on('disconnect', function () { 
//         // socket.leave("room-"+roomno);
//     });
// });

/** Chat App */
io.on('connection', function(socket) {
    console.log('User connected');

    // Event emited when a client connects
    socket.on('client-connected', function(data) {
        console.log('Node: Client Connected: ', data);
        // Api call to create room for client and agents
        axios.post('http://3c.local/api/v1/add-chat-user', data)
            .then(function (res) {
                if(res.data.status) {
                    var resp  = res.data.response;
                    console.log('Emiting Event from to vue: clientAddedToRoom')
                    socket.emit('clientAddedToRoom', resp);
                    socket.join(resp.room_number);
                    io.sockets.in(resp.room_number).emit('connectedToRoom', "We are connecting you to an agent");
                    console.log('Joined client to room : ', resp.room_number);
                    sendRooms();
                } else {
                    console.log(res)
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    // Event emited when an agent gets connected
    socket.on('get-added-rooms', function() {
        console.log('Node: Get Added Rooms');
        sendRooms();
    });

    // Event emited by agents when they want to get added to some rooms
    socket.on('add-agent-to-rooms', function(rooms) {
    //    if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) roomno++;
        console.log('Node: Add Agent To Rooms ', rooms);
        for (var i = 0, len = rooms.length; i < len; i++) {
            if(!(rooms[i].name in socket.rooms)) {
                socket.join(rooms[i].name);
                socket.emit('agent-added-to-room', rooms[i]);
                console.log('Agent Added To Room ', rooms[i].name);
            }
        }
    });

    // API call to get all the agent list and the list of rooms they are assigned to with status.
    var sendRooms = function() {
        console.log('In Send Rooms Function');

    //    TODO: API calls to get data of all agent_id and rooms they are assigned to with status
        axios.get('http://3c.local/api/v1/get-agents')
            .then(function (res) {
                if(res.data.status) {
                    console.log('Node : New Rooms Added ', res.data.response);
                    io.sockets.emit('new-rooms-added', res.data.response);
                } else {
                    console.log(res);
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    }

    socket.on('msg', function(data) {
        // Send message to everyone in that particular room
        io.sockets.in(data.roomNo).emit('newmsg', data);
    });

    //////////////////////////////////////////////////////////////////////////////////////////////
    
    socket.on('setUsername', function(data) {
        console.log(data);
        
        if(users.indexOf(data) > -1) {
            socket.emit('userExists', data + ' Username is taken! Try some other username.');
        } else {
            users.push(data);
            socket.emit('userSet', {username: data});
            
            // Increase room no if 2 clients are present in a room.
            if (io.sockets.adapter.rooms["room-"+roomno] && io.sockets.adapter.rooms["room-"+roomno].length > 1) {
                roomno++;
            }
            socket.join("room-"+roomno);

            //Send this event to everyone in the room.
            io.sockets.in("room-"+roomno)
                .emit('connectToRoom', { roomNo: roomno });
        }
    });

    // socket.on('msg', function(data) {
    //     // Send message to everyone in that particular room
    //     io.sockets.in("room-"+data.roomNo).emit('newmsg', data);
    // })
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});