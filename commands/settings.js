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
var fields = { //and defaults
	"channelName": "counting",
	"customEmoji": {
		"69420": "👀",
		"10000": "🤯",
		"1000": "🏆",
		"420": "👀",
		"100": "💯",
		"69": "👀",
		"42": "🧑‍🚀",
		"21": "fuckery"
	},
	"blacklistedUsers": {
		"1":"reason"
	},
	"blacklistedRoles": {

	},
	"permaDeath": true,

};


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
				sql = `CREATE TABLE s${message.guild.id} (cfg VARCHAR(255), value VARCHAR(255), id INT AUTO_INCREMENT PRIMARY KEY)`;
				con.query(sql, function (err, result) {
					if (err) {
						if(err.code == "ER_TABLE_EXISTS_ERROR") {
							console.log(`${cheader} ${warn("Table already exists")}`);
							onReady(message, args);
							con.end();
						} else {
							console.log(`${cheader} ${error("Table creation failed")}`);
							console.log(err);
							message.channel.send("An error has occurred, changes haven't been saved");
						}
					} else {
						for (let key in fields) {
							if(typeof fields[key] == "object") {
								
								for (let nestedKey in fields[key]) {
									sql = `INSERT INTO countingbot.s${message.guild.id} (cfg, value) VALUES ("${nestedKey}", "${fields[key][nestedKey]}")`;
									console.log(nestedKey, fields[key][nestedKey]);
									con.query(sql, function (err, result) {
										if (err) console.log(err);
									});
								}
							} else {
								console.log(key, fields[key]);
								sql = `INSERT INTO countingbot.s${message.guild.id} (cfg, value) VALUES ("${key}", "${fields[key]}")`;
								con.query(sql, function (err, result) {
									if (err) console.log(err);
								});
							}
						}
						onReady(message, args);
						con.end();
					}
				});
			}
		
		});
	},
};

function onReady(message, args) {
	if(!args[0]) {
		message.channel.send("Arguments missing! `set <option> <value>` or `get <option>`");
	} else {
		var con = mysql.createConnection({
			host: process.env.SQL_HOST,
			user: process.env.SQL_USER,
			password: process.env.SQL_PASS,
			database: process.env.SQL_DB
		});
		if(args[0] == "set") {
			sql = `UPDATE countingbot.s${message.guild.id} SET value = "${args[2]}" WHERE cfg = "${args[1]}"`;
			con.query(sql, function (err, result) {
				if (err) console.log(err);
				message.channel.send(`Option ${args[1]} is set to ${args[2]}`);
			});
			con.end();
		}
		if(args[0] == "get") {
			sql = `SELECT * FROM countingbot.s${message.guild.id} WHERE cfg = "${args[1]}"`;
			con.query(sql, function (err, result) {
				if (err) console.log(err);
				message.channel.send(`Option ${args[1]} is set to ${result[0].value}`);
			});
			con.end();
		}
	}
}