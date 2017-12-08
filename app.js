var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

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
users = [];
var roomno = 1;
io.on('connection', function(socket) {
    console.log('A user connected');

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
    
    socket.on('msg', function(data) {
        //Send message to everyone in that particular room
        io.sockets.in("room-"+data.roomNo).emit('newmsg', data);
    })
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});