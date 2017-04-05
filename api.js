;(function() {
	const router = require("express").Router();

	router.get("/ping", function(req, res) {
		res.send("pong");
	});

	module.exports = router;
}());
