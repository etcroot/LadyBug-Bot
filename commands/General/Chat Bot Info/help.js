const { Command, RichDisplay, util } = require("klasa");
const { MessageEmbed } = require("discord.js");
const { formatUsage } = require("../../../utils/utils.js");

class Help extends Command {
  constructor(...args) {
    super(...args, {
      description: (language) => language.get("COMMAND_HELP_DESCRIPTION"),
      usage: "(command:command)",
      guarded: true
    });
    
    this.createCustomResolver("command", (arg, possible, message) => {
      if (!arg) return undefined;
      return this.client.arguments.get("command").run(arg, possible, message);
    });

    this.handlers = new Map();
  }
  
  async run(msg, [command]) {
    const { currency } = this.client.constants;
    if(command) {
      const cost = command.category === "Canvas" ? `10 ${currency}` : command.cost ? `${command.cost} ${currency}` : null;
      const embed = new MessageEmbed()
        .setTitle(command.name)
        .setColor(0xff0000)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
        .setDescription([
          `**${util.isFunction(command.description) ? command.description(msg.language) : command.description}**`,
          cost ? `**Cost**: ${cost}` : "",
          msg.language.get("COMMAND_HELP_USAGE", formatUsage(command.usage.fullUsage(msg))),
          msg.language.get("COMMAND_HELP_EXTENDED"),
          `\`\`\`${util.isFunction(command.extendedHelp) ? command.extendedHelp(msg.language) : command.extendedHelp}\`\`\``
        ].join("\n"));
      return msg.send({ embed });
    }
    if(msg.guild && msg.guild.me.permissions.has(["MANAGE_MESSAGES", "ADD_REACTIONS", "EMBED_LINKS", "READ_MESSAGE_HISTORY"])) {
      const previous = this.handlers.get(msg.author.id);
      if(previous) previous.stop();
      const display = new RichDisplay(
        new MessageEmbed()
          .setColor(0xff0000)
          .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
      );
      const help = await this.buildHelp(msg);
      const categories = Object.keys(help);
      for(let cat = 0; cat < categories.length; cat++) {
        const message = ["`"];
        display.addPage((em) => {
          em.setTitle(`${categories[cat]} Commands`);
          const subCategories = Object.keys(help[categories[cat]]);
          for (let subCat = 0; subCat < subCategories.length; subCat++) message.push(`${help[categories[cat]][subCategories[subCat]].join("\n")}`);
          message.push("`");
          em.setDescription(message.join("\n"));
          return em;
        });
      }
      const handler = await display.run(await msg.send("Loading commands..."), {
        filter: (reaction, user) => user.id === msg.author.id,
        time: 1000 * 60 * 3
      });
      handler.on("end", () => this.handlers.delete(msg.author.id));
      this.handlers.set(msg.author.id, handler);
      return handler;
    }
    const help = await this.buildHelp(msg);
    const categories = Object.keys(help);
    const helpMessage = [];
    for(let cat = 0; cat < categories.length; cat++) {
      helpMessage.push(`**${categories[cat]} Commands:**`, "```asciidoc");
      const subCategories = Object.keys(help[categories[cat]]);
      for(let subCat = 0; subCat < subCategories.length; subCat++) helpMessage.push(`= ${subCategories[subCat]} =`, `${help[categories[cat]][subCategories[subCat]].join("\n")}\n`);
      helpMessage.push("```", "\u200b");
    }
    return msg.author.send(helpMessage, { split: { char: "\u200b" } })
      .then(() => { if(msg.channel.type !== "dm") msg.sendLocale("COMMAND_HELP_DM"); })
      .catch(() => { if(msg.channel.type !== "dm") msg.sendLocale("COMMAND_HELP_NODM"); });
  }
  
  async buildHelp(message) {
    const help = {};

    const commandNames = [...this.client.commands.keys()];
    const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

    await Promise.all(this.client.commands.map((command) =>
      this.client.inhibitors.run(message, command, true)
        .then(() => {
          if (!help.hasOwnProperty(command.category)) help[command.category] = {};
          if (!help[command.category].hasOwnProperty(command.subCategory)) help[command.category][command.subCategory] = [];
          const description = typeof command.description === "function" ? command.description(message.language) : command.description;
          help[command.category][command.subCategory].push(`${message.guildSettings.prefix}${command.name.padEnd(longest)} ${description}`);
        })
        .catch(() => {
          // noop
        })
    ));

    return help;
  }
}

module.exports = Help;
