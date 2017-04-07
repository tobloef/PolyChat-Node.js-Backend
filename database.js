;(function() {
	const mysql = require("mysql");
	let config;
	try {
		config = require("./mysql_config");
	} catch(exception) {}

	const messageLimit = 1000;

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
					console.error("Error executing query.\n" + error.stack);
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

	function getMessages(successCallback, errorCallback) {
		let query = "SELECT users.nickname, messages.message FROM messages INNER JOIN users ON messages.user_id=users.id ORDER BY messages.id DESC LIMIT ?;";
		executeQuery(query, messageLimit, successCallback, errorCallback);
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
