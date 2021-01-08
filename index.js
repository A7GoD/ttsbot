const custom = require("./custom.json");
const discord = require("discord.js");
const tts = require("discord-tts");

const client = new discord.Client();

let prefix = "~";
let delay = 500;

const messages = custom.joinMessages;

client.on("ready", () => {
  console.log("Bot is running.");
});

client.on("message", (msg) => {
  if (msg.content[0] === "~") {
    console.log("uwu");
  }
});

client.on("voiceStateUpdate", (prevState, newState) => {
  const broadcast = client.voice.createBroadcast();

  if (
    channelCheck(prevState, newState) === "joined" &&
    (newState.channelID ?? 0) &&
    newState.member.id !== "776437574948356107"
  ) {
    newState.channel.join().then((con) => {
      const ob = messages.find((user) => user.id === newState.member.id);
      if (ob) {
        setTimeout(() => broadcast.play(tts.getVoiceStream(ob.msg)), delay);
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
    });
  } else if (
    channelCheck(prevState, newState) === "left" &&
    newState.member.id !== "776437574948356107"
  ) {
    prevState.channel.join().then((con) => {
      broadcast.play(
        tts.getVoiceStream(
          `${newState.member.nickname ?? newState.member.displayName} has left.`
        )
      );
      const dispatcher = con.play(broadcast);
    });
  }
});

client.login(auth_token);

channelCheck = (prevState, newState) => {
  if (prevState.channelID !== newState.channelID) {
    if (newState.channelID !== null) return "joined";
    else if (newState.channelID === null) return "left";
  } else return null;
};
