;(function() {
	const mysql = require("mysql");
	let config;
	try {
		config = require("./database_config");
	} catch(exception) {}

	let pool;

	function open() {
		if (!config) {
        	console.error("No database configuration file. Cannot set up database.");
        	return;
    	}

    	pool = mysql.createPool(config);
    	console.log("Opened MySQL connection pool.");
	}

	function executeQuery(query, values, callback) {
		if (!pool) {
			console.error("Error: No connection pool");
			return;
		}
		pool.getConnection(function(error, connection) {
			if (error || !connection) {
				console.error("Error getting connection from pool.\n" + error.stack);
				return;
			}
			connection.query(query, values, function(error, results, fields) {
				connection.release();
				if (error) {
					console.error("Error executing query.\n" + error.stack);
					return;
				}
				if (callback) {
					callback(results, fields);
				}
			});
		});
	}

	function insertMessage(message, callback) {
		const query = "INSERT INTO messages SET ?";
		const values = [message];
		executeQuery(query, values, callback);
	}

	function insertUser(user, callback) {
		const query = "INSERT INTO users SET ?";
        const values = [user];
        executeQuery(query, values, callback);
	}

	function getMessages(callback) {
		let query = "SELECT users.username, messages.message FROM messages INNER JOIN users ON messages.user_id=users.id";
		executeQuery(query, null, callback);
	}

	function cleanup() {
		if (!pool) {
			return;
		}
		pool.end(function(error) {
			if (error) {
				console.error("Error closing pool.\n" + error.stack);
				return;
			}
			console.log("Closed MySQL connection pool.");
		});
	}

	module.exports = {
		insertMessage,
		insertUser,
		getMessages,
		cleanup,
		open
	}
}());
