let isEnabled = false;
let controller = undefined;
let messagePorts = new Set();
let fs = require("fs");
let path = require("path");

let preferencePort = undefined;

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;

  let discordIconSvg = fs.readFileSync(
    path.resolve(__dirname, "discord-logo-black.svg"),
    { encoding: "utf-8" },
  );

  controller.sendMessageToEditor({
    type: "add-action",
    info: {
      actionId: 0,
      short: "xdiscvc",
      displayName: "Volume Control",
      rendering: "standard",
      category: "utility",
      blockTitle: "Volume Control",
      defaultLua: 'gps("package-macos-volume", "input", val)',
      color: "#5865F2",
      icon: discordIconSvg,
      blockIcon: discordIconSvg,
      selectable: true,
      movable: true,
      hideIcon: false,
      type: "single",
      toggleable: true,
      actionComponent: "volume-change-action",
    },
  });

  isEnabled = true;
};

exports.unloadPackage = async function () {
  controller.sendMessageToEditor({
    type: "remove-action",
    actionId: 0,
  });
  controller = undefined;
  messagePorts.forEach((port) => port.close());
  messagePorts.clear();
};

exports.addMessagePort = async function (port, senderId) {
  messagePorts.add(port);
  port.on("close", () => {
    messagePorts.delete(port);
  });
  if (senderId == "preference") {
    if (preferencePort) {
      preferencePort.close();
      messagePorts.delete(preferencePort);
    }
    preferencePort = port;
    preferencePort.on("message", (e) => onPreferenceMessage(e.data));
  }
  if (senderId == "voice-channel-action") {
    port.on("message", (e) => onVoiceChannelActionMessage(port, e.data));
  }
  port.start();
};

exports.sendMessage = async function (args) {
  let type = args[0];
  if (type === "input") {
    let vol = Number(args[1]);
    print("macos volume change", vol);
  }
};
