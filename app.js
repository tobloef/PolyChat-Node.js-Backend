;(function() {
	const WebSocket = require("ws");
	const config = require("./config");

	const wss = new WebSocket.Server(config);
	const clients = [];

	wss.on("connection", function(ws) {
		ws.on("message", function(data) {
			onMessage(data, ws);
		});
		ws.on("close", function() {
			onClose(ws);
		});
	});

	function onClose(ws) {
		for (let i = 0; i < clients.length; i++) {
			if (clients[i].ws === ws) {
				console.log(`${clients[i].nickname} disconnected`);
				broadcast(JSON.stringify({
					type: "disconnected",
					data: clients[i].nickname
				}));
				clients.splice(i, 1);
				broadcast(JSON.stringify({
					type: "onlineCount",
					data: clients.length
				}));
			}
		}
	}

	function onMessage(data, ws) {
		const event = JSON.parse(data);
		switch (event.type) {
			case "connect":
				connectEvent(event, ws);
				break;
			case "message":
				messageEvent(event, ws);
			break;
		}
	}

	function messageEvent(event, ws) {
		for (let i = 0; i < clients.length; i++) {
			if (clients[i].ws === ws) {
				console.log(`${event.data.nickname}: ${event.data.message}`);
				broadcastToOthers(ws, event);
			}
		}
	}

	function connectEvent(event, ws) {
		if (nicknameAvailable(event.data)) {
			console.log(`${event.data} connected`);
			clients.push({
				nickname: event.data,
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
			broadcast(JSON.stringify({
				type: "connected",
				data: event.data
			}));
		} else {
			ws.send(JSON.stringify({
				type: "connectResponse",
				data: "nicknameTaken"
			}));
		}
	}

	function broadcast(data) {
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	}

	function broadcastToOthers(ws, data) {
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	}

	function nicknameAvailable(nickname) {
		for (let i = 0; i < clients.length; i++) {
			if (clients[i].nickname.toLowerCase() === nickname.toLowerCase()) {
				return false;
			}
		}
		return true;
	}
}());