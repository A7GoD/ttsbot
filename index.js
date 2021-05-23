const custom = require("./custom.json");
const discord = require("discord.js");
const tts = require("discord-tts");

const client = new discord.Client();

let prefix = "~";
let delay = 1000;

let stream = null;

const messages = custom.joinMessages;

client.on("ready", () => {
  console.log("Bot is running.");
});

client.on("message", (msg) => {
  let message = msg.content;
  if (message.startsWith("~")) {
    command = message.slice(1, message.length).split(" ")[0];

    switch (command) {
      case "say":
        sentence = message.replace("~say ", "");
        const broadcast = client.voice.createBroadcast();
        const user = msg.guild.member(msg.author);
        if (user.voice.channel) {
          user.voice.channel
            .join()
            .then((con) => {
              broadcast.end();
              if (messages.find((user) => user.id === msg.author.id)) {
                broadcast.play(tts.getVoiceStream(`${sentence}`));
              } else {
                broadcast.play(
                  tts.getVoiceStream(
                    `Shush, ${
                      user.nickname ?? user.displayName
                    }, am not in mood.`
                  )
                );
              }
              const dispatcher = con.play(broadcast);
            })
            .catch(() => {
              msg.reply("couldn't connect to the VC, let me innnn!");
            });
        } else msg.reply("You need to be in a VC to use this feature. Baaka");
        break;
      default:
        msg.reply("Command not recognised.");
    }
  }
});

client.on("voiceStateUpdate", async (prevState, newState) => {
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

client.login(process.env.auth_token);

channelCheck = (prevState, newState) => {
  if (prevState.channelID !== newState.channelID) {
    if (newState.channelID !== null) return "joined";
    else if (newState.channelID === null) return "left";
  } else return null;
};
