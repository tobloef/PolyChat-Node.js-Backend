;(function() {
	const database = require("./database");

	const router = require("express").Router();

	router.get("/ping", function(req, res) {
		res.send("pong");
	});

	router.get("/messages", function(req, res) {
		database.getMessages(function(results) {
			res.send(results);
		});
	});

	module.exports = router;
}());
