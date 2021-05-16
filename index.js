// Copyright (C) 2019-2021 Vukky, Gravity Assist, Skelly

require("dotenv").config();
const fs = require("fs");
const counting = require("./counting.js");
const Discord = require("discord.js");
const ora = require("ora");
const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION", "USER"]});
const pjson = require("./package.json");
const embeds = require("./utilities/embeds");
const config = require("./config.json");
const vukkytils = require("./utilities/vukkytils");
const format = require("util").format;
const prefix = process.env.BOT_PREFIX;
client.commands = new Discord.Collection();
let updateRemindedOn = null;
const chokidar = require("chokidar");
const chalk = require("chalk");

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
let embedPermissions = 1;

console.clear();
console.log(`[${vukkytils.getString("STARTUP")}] ${vukkytils.getString("STARTING")}`);

function commandPrep(forStartup) {
	const commandSpinner = ora(`${vukkytils.getString("STARTUP_LOADING_COMMANDS")}\n`).start();
	commandSpinner.prefixText = `[${vukkytils.getString("STARTUP")}]`;
	commandSpinner.spinner = "shark";
	commandSpinner.render();
	let commandsLoaded = 0;
	for (const file of commandFiles) {
		commandSpinner.text = `${format(vukkytils.getString("STARTUP_LOADING_SPECIFIC_COMMAND"), file, commandFiles.indexOf(file), commandFiles.length)}\n`;
		try {
			commandSpinner.render();
			const command = require(`./commands/${file}`);
			client.commands.set(command.name, command);
			if (!command.name) {
				commandSpinner.fail(`Couldn't load ${file}: No name`);
				process.exit(1);
			} else if (!command.execute) {
				commandSpinner.fail(`Couldn't load ${file}: No execute function`);
				process.exit(1);
			}
		} catch (error) {
			commandSpinner.fail(`Couldn't load ${file}: ${error.message}`);
			throw error;
		}
		commandsLoaded++;
		if(commandsLoaded == commandFiles.length) {
			commandSpinner.succeed(vukkytils.getString("STARTUP_COMMANDS_LOADED"));
			if(forStartup == true) login();
		}
	}
}

commandPrep(true);

const cooldowns = new Discord.Collection();

client.once("ready", async () => {
	console.log(`\n[${vukkytils.getString("STARTUP")}] ${format(vukkytils.getString("READY"), pjson.version)}\n`);
	if(!process.env.BOT_PREFIX && process.env.PREFIX) console.log(`[${vukkytils.getString("STARTUP")}] ${vukkytils.getString("ENV_PREFIX_RENAMED")}`);
	const statuses = [
		"with numbers",
		"with a calculator",
		"with other counting bots",
		"with the banhammer",
		"with the database",
		"with discord.js",
	];
	client.user.setActivity(`with the number 1 (${pjson.version})`);
	setInterval(() => {
		const index = Math.floor(Math.random() * (statuses.length - 1) + 1);
		client.user.setActivity(`${statuses[index]} (${pjson.version})`);
	}, 15000);
	counting.start(client);
	chokidar.watch("commands/*.js", {ignoreInitial: true}).on("all", (event, path) => {
		path = path.substr(path.lastIndexOf("\\") + 1);
		if(event == "add") {
			const commandSpinner = ora(`Loading ${path}\n`).start();
			commandSpinner.prefixText = "[autoreload]";
			commandSpinner.spinner = "point";
			try {
				const command = require(`./commands/${path}`);
				client.commands.set(command.name, command);
				commandSpinner.succeed(`Loaded ${path}`);
			} catch (error) {
				commandSpinner.fail(`Couldn't load ${path}: ${error.message}`);
				throw error;
			}
		} else if (event == "change") {
			const commandSpinner = ora(`Reloading ${path}\n`).start();
			commandSpinner.prefixText = "[autoreload]";
			commandSpinner.spinner = "point";	
			try {
				delete require.cache[require.resolve(`./commands/${path}`)];
				const command = require(`./commands/${path}`);
				client.commands.set(command.name, command);
				commandSpinner.succeed(`Reloaded ${path}`);
			} catch (error) {
				commandSpinner.fail(`Couldn't reload ${path}: ${error.message}`);
				throw error;
			}
		}
	});
	embeds.setAvatarURL(client.user.displayAvatarURL());
});

client.on("message", async message => {
	if (message.author.bot) return; //Prevent bots from triggering it
	if ((message.channel.type == "text" && !message.guild.me.hasPermission("EMBED_LINKS"))) embedPermissions = 0;
	if (message.content.toLowerCase().includes(`<@!${client.user.id}>`) && config.misc.prefixReminder == true && !message.content.startsWith(prefix)) message.channel.send(`Hi ${message.author}! If you need help type \`${process.env.BOT_PREFIX}help\`, and I'll send you all my commands!\nMy prefix is \`${process.env.BOT_PREFIX}\`.`);
	
	
	if (message.channel.name == config.counting.channelName) counting.check(message, client); //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


	if (!message.content.toLowerCase().startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (commandName == "") return;

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	// Make sure the command exists
	if (!command) {
		if(config.misc.invalidCmdReminder) {
			let reply = format(vukkytils.getString("COMMAND_INVALID"), `**${commandName}**`);
			if (embedPermissions == 0) return message.channel.send(reply);
			message.channel.send(embeds.errorEmbed(reply));
		}
		return;
	}

	// Handle various exports
	const requiredAPIs = {
		mysql: config.misc.mysql == true,
	};
	if(command.requiredAPIs) {
		if(command.requiredAPIs.includes("mysql") && !requiredAPIs.mysql) {
			if (embedPermissions == 0) return message.channel.send(`**${commandName}** should be enabled, but it isn't! The bot's creator broke something!`);
			return message.channel.send(embeds.errorEmbed(`**${commandName}** should be enabled, but it isn't! The bot's creator broke something!`));
		}
	}

	if(command.disabled) {
		let errorMsg = `**${commandName}** is disabled.`;
		if (embedPermissions == 0) return message.channel.send(errorMsg);
		return message.channel.send(embeds.errorEmbed(errorMsg));
	}

	if (command.guildOnly && message.channel.type == "dm") {
		return message.channel.send(embeds.errorEmbed(format(vukkytils.getString("COMMAND_GUILD_ONLY"), `**${commandName}**`)));
	}

	if (command.args && !args.length) {
		let reply = "Not enough arguments!";

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		if (embedPermissions == 0) return message.channel.send(reply);
		return message.channel.send(embeds.errorEmbed(reply));
	}

	if (command.botPermissions) {
		for (let i = 0, len = command.botPermissions.length; command.botPermissions; i < len, i++) {
			if (command.botPermissions[i] == undefined) {
				break;
			}
			if ((message.channel.type == "text" && !message.guild.me.hasPermission(command.botPermissions[i]))) {
				let reply = format(vukkytils.getString("BOT_PERMISSION_NEEDED"), command.botPermissions[i]);
				if (embedPermissions == 0) return message.channel.send(reply);
				return message.channel.send(embeds.errorEmbed(reply));
			}
		}
	}

	if (command.userPermissions) {
		for (let i = 0, len = command.userPermissions.length; command.userPermissions; i < len, i++) {
			if (command.userPermissions[i] == undefined) {
				break;
			}
			if ((message.channel.type == "text" && !message.member.hasPermission(command.userPermissions[i]))) {
				let reply = format(vukkytils.getString("USER_PERMISSION_NEEDED"), command.userPermissions[i]);
				if (embedPermissions == 0) return message.channel.send(reply);
				return message.channel.send(embeds.errorEmbed(reply));
			}
		}
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 2) * 1000;

	if (timestamps.has(message.author.id) && !config.misc.owner.includes(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			console.log(timeLeft.toFixed(0));
			let errorMsg = `You need to wait ${timeLeft.toFixed(1)} more second(s) before you can use the \`${command.name}\` command again.`;
			if (embedPermissions == 0) return message.channel.send(errorMsg);
			return message.channel.send(embeds.cooldownEmbed(errorMsg));
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	// Execute the command
	try {
		command.execute(message, args);
	} catch (error) {
		console.log(`[${command.name}] ${error.message}`);
		console.error(error);
		message.reply("there was an error trying to execute that command! Contact the developer!", embeds.errorEmbed(error.message));
	}
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
	if (newMessage && newMessage.partial) {
		await newMessage.fetch()
			.catch(error => {
				console.log("Something went wrong when fetching the message: ", error);
			});
	}
	if (newMessage.channel.name == config.counting.channelName) {
		counting.deletion(newMessage);
	}
});

client.on("messageDelete", message => {	
	if (message.channel.name == config.counting.channelName) {
		counting.deletion(message);
	}
});

client.on("messageReactionAdd", async function(reaction, user){
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error("Something went wrong when fetching the message: ", error);
			return;
		}
	}
});

async function login() {
	const loginSpinner = ora().start();
	loginSpinner.prefixText = `[${vukkytils.getString("STARTUP")}]`;
	loginSpinner.spinner = "point";
	loginSpinner.text = `${vukkytils.getString("STARTUP_LOGGING_IN")}\n`;
	try {
		await client.login(process.env.BOT_TOKEN);
		loginSpinner.succeed(format(vukkytils.getString("STARTUP_LOGGED_IN"), client.user.tag));
	} catch (e) {
		if(e && e.message && e.message.endsWith("ENOTFOUND discord.com")) { 
			loginSpinner.fail(vukkytils.getString("STARTUP_LOGIN_FAILED_INTERNET_UNAVAILABLE"));
		} else {
			loginSpinner.fail(vukkytils.getString("STARTUP_LOGIN_FAILED"));
		}
		throw e;
	}
}

process.on("uncaughtException", function (err) {
	console.error(err);
});