// https://itsliveradio.apple.com/streams/live/beats-1/master_web.m3u8
// https://itsliveradio.apple.com/streams/978194965/hub07/session04/256k/prog.m3u8

const { exec } = require("child_process");
const Discord = require("discord.js");
/*
sound-check 797604513472184342
groovy-chat 713902713833914429
*/

let state = null;
function isLive() {
  const date = new Date();
  return date.getHours() >= 2 && date.getHours() < 4 && date.getDay() === 0;
}

const NodeId3 = require("node-id3");
const axios = require("axios");
async function nowPlaying() {
  const ENDPOINT =
    "https://itsliveradio.apple.com/streams/978194965/hub07/session04/256k/";
  const { data } = await axios.get(`${ENDPOINT}prog.m3u8`);
  const matches = data.match(/^prog-\d+T\d+Z\.mp4$/gm);
  const file = matches[0];
  const url = `${ENDPOINT}${file}`;
  const resp = await axios.get(url, { responseType: "arraybuffer" });
  const trackInfo = NodeId3.read(resp.data);
  const outputString = `:musical_note: ${trackInfo.artist} - ${trackInfo.title}`;
  return outputString;
}

async function currentTrack() {
  if (isLive()) {
    return new Promise(async (resolve, reject) => {
      const stdout = await nowPlaying();
      if (state !== stdout) {
        if (stdout.startsWith(":musical_note:")) {
          state = stdout;
          resolve(stdout);
        } else {
          reject("no change");
        }
      } else {
        reject("no change");
      }
    });
  } else {
    return Promise.reject("not correct time");
  }
}

const client = new Discord.Client();

function check(channel) {
  currentTrack()
    .then((msg) => {
      console.log(msg);
      // channel.send("Hello World,  @halfcube#7940 here testing the Now Playing bot for Soulection Radio.")
      channel.send(msg);
    })
    .catch((err) => {
      // noop
    })
    .then(() => {
      setTimeout(() => {
        check(channel);
      }, 1000);
    });
}
client.on("ready", () => {
  const channel = client.channels.cache.get("713902713833914429");
  // channel.send("Live Tracklisting Enabled")
  check(channel);
});

client.on("message", (msg) => {
  if (isLive() && msg.content === "-np") {
    msg.reply(`Soulection Radio Live on Apple Music 1

${state}`);
  }
});

client.login(process.env.DISCORD_BOT_KEY);
