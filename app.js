var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var axios = require('axios');


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
                    console.log(resp.name + 'is joined  to room : ', resp.room_number);
                    io.sockets.in(resp.room_number).emit('updateRoom', resp);
                    sendRooms();
                } else {
                    console.log(res);
                    io.sockets.in(socket.id).emit('clientNotAddedToRoom');
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    // Event emited when an agent gets connected
    socket.on('get-added-rooms', function() {
        console.log('Node: Get Added Rooms ');
        sendRooms();
    });

    // Event emited by agents when they want to get added to some rooms
    socket.on('add-agent-to-room', function(room) {
    //    if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) roomno++;
        
        console.log('Node: Add To Rooms ', rooms);
        for (var i = 0, len = rooms.length; i < len; i++) {
            if(socket.rooms.indexOf(room[i].name) < 0) {
                socket.join(rooms[i].name);
                socket.emit('agent-added-to-room', rooms[i]);
            }
        }
    });

    // API call to get all the agent list and the list of rooms they are assigned to with status.
    var sendRooms = function() {
        console.log('In Send Rooms Function');

    //    TODO: API calls to get data of all agent_id and rooms they are assigned to with status
        axios.get('http://3c.local/api/v1/get-agents')
        .then(function (res) {
            console.log(res.data.status)
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
        
        console.log('message sent');
        console.log(data);
        /**api call to add message to the database */
        axios.post(data.widgetHost+ '/api/v1/add-messages', data)
            .then(function (response) {
                if(response.data.status) {
                    // Send message to everyone in that particular room
                    console.log(response.data.response);
                    io.sockets.in(data.roomNumber)
                        .emit('newmsg',data);
                }
            })
            .catch(function (error) {
                console.log(error);
            });

    });   

    /////////////////////////////////////////////////////////////////
    
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

    /** on socket disconnection */
    socket.on('disconnect', function()  {
        console.log(socket.id,'disconnected');
        
        io.sockets.in(socket.id).emit('disconnect');
        socket.disconnect();
    });   

    
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});