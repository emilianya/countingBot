// Copyright (C) 2021 vtheskeleton
const config = require("../config.json");
require("dotenv").config();
var chalk = require("chalk");
var embeds = require("../utilities/embeds");
var mysql = require("mysql");
var sql = "";
var cheader = "[settings]";
const error = chalk.bold.red;
const warn = chalk.yellowBright;
const success = chalk.green;
module.exports = {
	name: "settings",
	description: "Change your servers settings!",
	cooldown: 0,
	guildOnly: true,
	requiredAPIs: ["mysql"],
	usage: "<setting to change> <new value>",
	execute(message, args) {
		var con = mysql.createConnection({
			host: process.env.SQL_HOST,
			user: process.env.SQL_USER,
			password: process.env.SQL_PASS,
			database: process.env.SQL_DB
		});
		con.connect(function(err) {
			if (err) {
				return console.log(`${cheader} ${error("SQL connection failed. Maybe the credentials are invalid?")}`);
			} else {
				sql = "CREATE TABLE settings (serverid VARCHAR(255), cfg VARCHAR(255), value VARCHAR(255), id INT AUTO_INCREMENT PRIMARY KEY)";
				con.query(sql, function (err, result) {
					if (err) {
						if(err.code == "ER_TABLE_EXISTS_ERROR") {
							console.log(`${cheader} ${warn("Table already exists")}`);
						} else {
							console.log(`${cheader} ${error("Table creation failed")}`);
						}
					} else {
						
					}
				});
				con.end();
			}
		});
	},
};
