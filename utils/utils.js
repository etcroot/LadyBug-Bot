const { util: { toTitleCase } } = require("klasa");

class Util {
  constructor() {
    throw new Error("Static class");
  }

  static capitalize(str) {
    return str.split("_").map(toTitleCase).join(" ");
  }
  
  static embedContains(embed, str) {
    if(embed.title && embed.title.toLowerCase().includes(str.toLowerCase())) return true;
    if(embed.description && embed.description.toLowerCase().includes(str.toLowerCase())) return true;
    if(embed.footer && embed.footer.text && embed.footer.text.toLowerCase().includes(str.toLowerCase())) return true;
    if(embed.author && embed.author.name && embed.author.name.toLowerCase().includes(str.toLowerCase())) return true;
    if(embed.fields && embed.fields.length) {
      for(const field of embed.fields) {
        if(field.name && field.name.toLowerCase().includes(str.toLowerCase())) return true;
        if(field.value && field.value.toLowerCase().includes(str.toLowerCase())) return true;
      }
    }
    return false;
  }
  
  static slice(str, limit, suffix = "...") {
    if(str.length < limit) return str;
    if(suffix && suffix.length > limit) throw new Error("Suffix shouldn't be longer than limit.");
    if(!suffix) return str.slice(0, limit);
    return str.substring(0, limit - suffix.length) + suffix;
  }

  static random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static mix(str, str2) {
    return str.slice(0, str.length / 2) + str2.slice(str2.length / 2);
  }

  static getAttachment(msg) {
    const attach = msg.attachments.filter((x) => x.url && x.width && x.height);
    if(attach.size) return attach.first().url;
    const embeds = msg.embeds.filter((x) => x.image && x.image.url);
    if(embeds.length) return embeds[0].image.url;
    return null;
  }

  static* range(start, stop, incr = 1) {
    if(!stop) {
      stop = start;
      start = 0;
    }

    for(; start < stop; start += incr) {
      yield start;
    }
  }
}

module.exports = Util;