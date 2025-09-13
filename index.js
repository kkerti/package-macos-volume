let isEnabled = false;
let controller = undefined;
let messagePorts = new Set();
let fs = require("fs");
let path = require("path");
const { exec } = require("child_process");

let preferencePort = undefined;

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;

  // let discordIconSvg = fs.readFileSync(
  //   path.resolve(__dirname, "discord-logo-black.svg"),
  //   { encoding: "utf-8" },
  // );

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
      icon: "",
      blockIcon: "",
      selectable: true,
      movable: true,
      hideIcon: true,
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
  console.log("hi")
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
  if (senderId == "volume-change-action") {
    port.on("message", (e) => onVolumeChangeActionMessage(port, e.data));
  }
  port.start();
};

function onVolumeChangeActionMessage(port, data){
  console.log("onVolumeChangeActionMessage:", data)
}

function onPreferenceMessage(data) {
  console.log("Preference message:", data);
}

exports.sendMessage = async function (args) {
  let type = args[0];
  if (type === "input") {
    let vol = Number(args[1]);
    setVolumeDebounced(vol)
  }
};


let volumeTimeout = null;
let pendingVolume = null;

function setVolumeDebounced(vol) {
  // Store the latest volume request
  pendingVolume = vol;
  
  // Clear existing timeout
  if (volumeTimeout) {
    clearTimeout(volumeTimeout);
  }
  
  // Set new timeout
  volumeTimeout = setTimeout(() => {
    if (pendingVolume !== null) {
      // Validate volume range (0-100 for macOS)
      const clampedVol = Math.max(0, Math.min(100, pendingVolume));
      
      const command = `osascript -e "set volume output volume ${clampedVol}"`;
      
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error setting volume: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`Volume successfully set to ${clampedVol}`);
      });
      
      pendingVolume = null;
    }
    volumeTimeout = null;
  }, 100); // 100ms debounce delay
}
