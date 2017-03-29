;(function() {
	const WebSocket = require("ws");
	const config = require("./config");

	const wss = new WebSocket.Server(config);

	const clients = [];

	wss.on("connection", function(ws) {
		ws.on("message", function(data) {
			const parsed = JSON.parse(data);
			switch (parsed.type) {
				case "connect":
					if (nicknameAvailable(parsed.data)) {
						console.log(`${parsed.data} connected`);
						clients.push({
							nickname: parsed.data,
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
							data: parsed.data
						}));
					} else {
						ws.send(JSON.stringify({
							type: "connectResponse",
							data: "nicknameTaken"
						}));
					}
					break;
				case "message":
					for (let i = 0; i < clients.length; i++) {
						if (clients[i].ws === ws) {
							const message = parsed.data;
							console.log(`${message.nickname}: ${message.message}`);
							broadcastToOthers(ws, data);
						}
					}
				break;
			}
		});
		ws.on("close", function(code, reason) {
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
		});
	});

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