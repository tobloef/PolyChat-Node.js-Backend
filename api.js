;(function() {
	const database = require("./database");

	const router = require("express").Router();

	router.get("/ping", function(req, res) {
		res.send("pong");
	});

	router.get("/messages", function(req, res) {
		amount = req.query.amount;
		if (amount != null) {
			amount = parseInt(amount);
			if (isNaN(amount)) {
            	res.status(400).send("Invalid amount");
				return;
        	}
			if (amount < 0) {
				res.status(400).send("Amount cannot be negative");
				return;
			}
			if (amount > 1000) {
                res.status(400).send("Amount cannot be above 1000");
                return;
            }
		} else {
			amount = 1000;
		}
		database.getMessages(amount, function(results) {
			res.send(results);
		});
	});

	module.exports = router;
}());
