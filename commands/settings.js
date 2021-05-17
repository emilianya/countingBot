// Copyright (C) 2021 vtheskeleton
const config = require("../config.json");
require("dotenv").config();
var chalk = require("chalk");
var embeds = require("../utilities/embeds");
var mysql = require("mysql");
var sql = "";
var cheader = "[counting]";
const error = chalk.bold.red;
const warn = chalk.yellowBright;
const success = chalk.green;
module.exports = {
	name: "settings",
	description: "Change your servers settings!",
	cooldown: 0,
	guildOnly: true,
	requiredAPIs: ["mysql"],
	usage: "<highscore or current>",
	onStart(client) {
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
				sql = "CREATE TABLE counting (serverid VARCHAR(255), number VARCHAR(255), lastcounter VARCHAR(255), highscore VARCHAR(255), id INT AUTO_INCREMENT PRIMARY KEY)";
				con.query(sql, function (err, result) {
					if (err) {
						if(err.code == "ER_TABLE_EXISTS_ERROR") {
							console.log(`${cheader} ${warn("Table already exists")}`);
						} else {
							console.log(`${cheader} ${error("Table creation failed")}`);
						}
					}
				});

				client.guilds.cache.forEach(server => {
					let con = mysql.createConnection({
						host: process.env.SQL_HOST,
						user: process.env.SQL_USER,
						password: process.env.SQL_PASS,
						database: process.env.SQL_DB
					});
					let serverid = server.id.toString();
					sql = `SELECT * FROM counting WHERE serverid = ${server.id}`;
					con.query(sql, function (err, result) {
						if (err) {
							console.log(`${cheader} ${error("Something went wrong in the counting startup!")}`);
							console.log(err);
						} else {
							if (result.length <= 0) {
								sql = `INSERT INTO counting(serverid, number, lastcounter, highscore) VALUES (${server.id}, 0, 0, 0)`;
								con.query(sql, function (err, result) {
									if (err) {
										console.log(`${cheader} ${error("Failed to create row for server with ID:")} ${server.id}`);
									}
										
									servers[serverid.toString()] = {};
									servers[serverid.toString()].id = serverid;
									servers[serverid.toString()].number = 0;
									servers[serverid.toString()].lastcounter = 0;
									servers[serverid.toString()].highscore = 0;
									
								});
							} else {
								servers[serverid.toString()] = {};
								servers[serverid.toString()].id = serverid;
								servers[serverid.toString()].number = parseInt(result[0].number);
								servers[serverid.toString()].lastcounter = result[0].lastcounter;
								servers[serverid.toString()].highscore = parseInt(result[0].highscore);
							}

						}
					});
				});
				
				con.end();
			}
			console.log(`${cheader} ${success("Connected!")}`);
		});
	},
	execute(message, args) {
		var con = mysql.createConnection({
			host: process.env.SQL_HOST,
			user: process.env.SQL_USER,
			password: process.env.SQL_PASS,
			database: process.env.SQL_DB
		});
              
		con.connect(function(err) {
			if (err) console.log(err);
		});

	},
};
