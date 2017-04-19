;(function() {
	const WebSocket = require("ws");
	const database = require("./database");

	const clients = [];
	let wss;

	// Set up WebSockets with for the sever.
	function setup(server) {
		wss = new WebSocket.Server({
        	server,
    	});

    	wss.on("connection", onConnection);
	}

    // When a WebSocket connection is opened.
	function onConnection(ws) {
		ws.on("message", function(message) {
			onMessage(ws, message);
		});
		ws.on("close", function() {
			onClose(ws);
		});
	}

    // When the WebSocket connection closes.
	function onClose(ws) {
		for (let i = 0; i < clients.length; i++) {
			if (clients[i].ws === ws) {
				console.log(clients[i].nickname + " diconnected");
				broadcast(JSON.stringify({
					type: "disconnected",
					data: clients[i].nickname
				}));
				clients.splice(i, 1);
				broadcast(JSON.stringify({
					type: "onlineCount",
					data: clients.legnth
				}));
			}
		}
	}

    // When the WebSocket recieves any message.
	function onMessage(ws, message) {
		if (message == null) {
			return;
		}
		if (message == "ping") {
			ws.send("pong");
			return;
		}
		let event;
		try {
			event = JSON.parse(message);
		} catch (exception) {
			console.error("Couldn't parse message:\n" + message + "\n" + exception);
		}
		if (!event) {
			return;
		}
		switch (event.type) {
			case "connect":
				connectEvent(ws, event.data);
				break;
			case "message":
				messageEvent(ws, event.data);
				break;
		}
	}

	// When a new user sends the connect event to the server.
	// It's here that the user is added to the list of clients.
	function connectEvent(ws, nickname) {
		if (nicknameAvailable(nickname)) {
			console.log(nickname + " connected");
			database.insertUser({
				nickname: nickname
			}, function(results, fields) {
				clients.push({
            	    nickname: nickname,
					userId: results.insertId,
        	        ws
    	        });
	            ws.send(JSON.stringify({
            	    type: "connectResponse",
        	        data: "ready"
    	        }));
	            broadcast(JSON.stringify({
            	    type: "onlineCount",
        	        data: clients.length
    	        }));
	            broadcastToOthers(ws, JSON.stringify({
                	type: "connected",
                	data: {
                    	nickname: nickname
                	}
            	}));
			}, function(error) {
				ws.send(JSON.stringify({
					type: "connectResponse",
					data: "error"
				}));
			});
		} else {
			ws.send(JSON.stringify({
                type: "connectResponse",
                data: "nicknameTaken"
            }));
		}
	}

	// When the server recieves a new chat message.
	function messageEvent(ws, content) {
		for (let i = 0; i < clients.length; i++) {
			if (clients[i].ws === ws) {
                broadcastToOthers(ws, JSON.stringify({
                   	type: "message",
                	data: {
						nickname: clients[i].nickname,
						content: data
					}
                }));
				console.log(`${clients[i].nickname}: ${content}`);
				const message = {
					user_id: clients[i].userId,
					content
				};
				database.insertMessage(message);
			}
		}
	}

    // Broadcast a message to all connected users.
	function broadcast(data) {
		if (!wss) {
            return;
        }
		wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
	}

    // Broadcast a message to all connected users except for the specified client.
	function broadcastToOthers(ws, data) {
		if (!wss) {
			return;
		}
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
	}

	// Determine whether the nickname has already been taken.
    function nicknameAvailable(nickname) {
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].nickname.toLowerCase() === nickname.toLowerCase()) {
                return false;
            }
        }
        return true;
    }

	function cleanup() {
		if (wss) {
			wss.close();
		}
	}

	module.exports = {
		setup,
		cleanup
	};
}());
