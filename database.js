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

    	const pool = mysql.createPool(config);
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
			console.log("Executing query:\n" + query + "\n" + values);
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

	function addMessage() {
		// Todo
	}

	function addUser() {
		// Todo
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
		addMessage,
		addUser,
		cleanup,
		open
	}
}());
