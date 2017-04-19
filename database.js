;(function() {
	const mysql = require("mysql");
	let config;
	try {
		config = require("./mysql_config");
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

	function executeQuery(query, values, successCallback, errorCallback) {
		if (!pool) {
			console.error("Error: No connection pool");
			if (errorCallback) {
				errorCallback();
			}
			return;
		}
		pool.getConnection(function(error, connection) {
			if (error || !connection) {
				console.error("Error getting connection from pool.\n" + error.stack);
				if (errorCallback) {
                	errorCallback();
            	}
				return;
			}
			connection.query(query, values, function(error, results, fields) {
				connection.release();
				if (error) {
					console.error("Error executing query:\n" + mysql.format(query, values) + "\n" + error.stack);
					if (errorCallback) {
                		errorCallback();
            		}
					return;
				}
				if (successCallback) {
					successCallback(results, fields);
				}
			});
		});
	}

	function insertMessage(message, successCallback, errorCallback) {
		const query = "INSERT INTO messages SET ?";
		const values = [message];
		executeQuery(query, values, successCallback, errorCallback);
	}

	function insertUser(user, successCallback, errorCallback) {
		const query = "INSERT INTO users SET ?";
        const values = [user];
        executeQuery(query, values, successCallback, errorCallback);
	}

	function getMessages(limit, successCallback, errorCallback) {
		let query = "SELECT users.nickname, messages.content FROM messages INNER JOIN users ON messages.user_id=users.id ORDER BY messages.id DESC";
		values = [];
		if (limit != null) {
			query += " LIMIT ?";
			values.push(limit)
		}
		executeQuery(query, values, successCallback, errorCallback);
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
