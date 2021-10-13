const custom = require("./custom.json");
const discord = require("discord.js");
const tts = require("discord-tts");
const dotnev = require("dotenv");

dotnev.config();

const client = new discord.Client();

const featureToggle = {
  say: true,
  "join-message": true,
};

let prefix = "~";
let delay = 1000;

let stream = null;

const allowedUsers = [];

const messages = custom.joinMessages;

client.on("ready", () => {
  console.log("Bot is running.");
});

client.on("message", (msg) => {
  let message = msg.cleanContent;
  if (message.startsWith("~")) {
    command = message.slice(1, message.length).split(" ")[0];
    const user = msg.guild.member(msg.author);
    const isAdmin = user.permissions.has("ADMINISTRATOR", true);

    switch (command) {
      case "say":
        if (!featureToggle.say) break;

        sentence = message.replace("~say ", "");
        const broadcast = client.voice.createBroadcast();
        if (user.voice.channel) {
          user.voice.channel
            .join()
            .then((con) => {
              broadcast.end();
              if (
                messages.find((user) => user.id === msg.author.id) ||
                allowedUsers.indexOf(msg.author.id) !== -1
              ) {
                broadcast.play(tts.getVoiceStream(sentence));
              } else {
                broadcast.play(
                  tts.getVoiceStream(
                    `Shush, ${
                      user.nickname ?? user.displayName
                    }, am not in mood.`
                  )
                );
              }
              con.play(broadcast);
            })
            .catch(() => {
              msg.reply("couldn't connect to the VC, let me innnn!");
            });
        } else msg.reply("You need to be in a VC to use this feature. Baaka");
        break;

      case "permit":
        if (isAdmin) {
          msg.mentions.users.map((user) => allowedUsers.push(user.id));
          msg.reply(
            `Permitted ${msg.mentions.users.map(
              (user) => `${msg.guild.member(user).displayName} `
            )}`
          );
        } else msg.reply("This command can only be used by an admin.");
        break;

      case "toggle":
        if (isAdmin) {
          const command = msg.cleanContent.replace(/^~toggle\s*/g, "");

          if (command in featureToggle) {
            featureToggle[command] = !featureToggle[command];
            msg.reply(
              `${command} command has been ${
                featureToggle[command] ? "enabled" : "disabled"
              }.`
            );
          } else msg.reply("Feature not recognized or cannot be toggled");
        } else msg.reply("This command can only be used by an admin.");
        break;

      default:
        msg.reply("Command not recognised.");
    }
  }
});

client.on("voiceStateUpdate", async (prevState, newState) => {
  if (!featureToggle["join-message"]) return;

  const broadcast = client.voice.createBroadcast();
  if (
    channelCheck(prevState, newState) === "joined" &&
    (newState.channelID ?? 0) &&
    newState.member.id !== "776437574948356107"
  ) {
    newState.channel
      .join()
      .then((con) => {
        con.setSpeaking("SPEAKING");
        if (stream ?? 0) stream.end();
        const ob = messages.find((user) => user.id === newState.member.id);
        broadcast.end();
        if (ob) {
          setTimeout(() => {
            broadcast.play(tts.getVoiceStream(ob.msg));
          }, delay);
        } else {
          setTimeout(
            () =>
              broadcast.play(
                tts.getVoiceStream(
                  `${
                    newState.member.nickname ?? newState.member.displayName
                  } has joined.`
                )
              ),
            delay
          );
        }
        const dispatcher = con.play(broadcast);
        stream = dispatcher;
      })
      .catch(() => console.log("error"));
  } else if (
    channelCheck(prevState, newState) === "left" &&
    newState.member.id !== "776437574948356107"
  ) {
    prevState.channel
      .join()
      .then((con) => {
        broadcast.play(
          tts.getVoiceStream(
            `${
              newState.member.nickname ?? newState.member.displayName
            } has left.`
          )
        );
        const dispatcher = con.play(broadcast);
      })
      .catch(() => console.log("error"));
  }
});

client.login(process.env.AUTH_TOKEN);

channelCheck = (prevState, newState) => {
  if (prevState.channelID !== newState.channelID) {
    if (newState.channelID !== null) return "joined";
    else if (newState.channelID === null) return "left";
  } else return null;
};
