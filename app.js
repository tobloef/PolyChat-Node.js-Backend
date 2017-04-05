;(function() {
	const app = require("express")();
	const http = require("http");
	const api = require("./api");
	const websocket = require("./websocket");
	const database = require("./database");

	let cleanedUp = false;

	app.use("/api", api);

	const server = http.createServer(app);
	websocket.setup(server);

	server.listen(3000, function(error) {
		console.log("Started server on port " + server.address().port);
	});

	process.on("exit", cleanup);
	process.on("SIGINT", cleanup);
	process.on("uncaughtException", function(error) {
		console.error("Uncaught Exception\n", error);
		cleanup();
	});

	function cleanup() {
		if (cleanedUp) {
			return;
		}
		console.log("Cleaning up...");
		server.close();
		database.cleanup();
		websocket.cleanup();
		cleanedUp = true;
	}
}());
