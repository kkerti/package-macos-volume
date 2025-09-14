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
    setVolumeThrottled(vol)
  }
};


let volumeTimeout = null;
let pendingVolume = null;
let isVolumeChanging = false;
let lastVolumeChange = 0;
let lastVolumeValue = -1;

function setVolumeThrottled(vol) {
  pendingVolume = vol;
  
  const now = Date.now();
  const timeSinceLastChange = now - lastVolumeChange;
  const minInterval = 50; // Minimum 100ms between actual volume changes
  
  console.log("lastVolumeChange",lastVolumeChange);
  if (!isVolumeChanging && timeSinceLastChange >= minInterval) {
    // Execute immediately if enough time has passed
    executeVolumeChange();
  } else if (!volumeTimeout) {
    // Schedule the next change if one isn't already scheduled
    const delay = Math.max(0, minInterval - timeSinceLastChange);
    volumeTimeout = setTimeout(executeVolumeChange, delay);
  }
}

function executeVolumeChange() {
  if (pendingVolume === null) return;
  
  isVolumeChanging = true;
  lastVolumeChange = Date.now();
  
  // Clear timeout as we're executing now
  if (volumeTimeout) {
    clearTimeout(volumeTimeout);
    volumeTimeout = null;
  }
  
  const clampedVol = Math.max(0, Math.min(100, pendingVolume));
  const command = `osascript -e "set volume output volume ${clampedVol}"`;
  
  if(lastVolumeValue !== clampedVol){
    lastVolumeValue = clampedVol;
    exec(command, { timeout: 2000 }, (error, stdout, stderr) => {
      isVolumeChanging = false;
      
      if (error) {
        console.error(`Error setting volume: ${error.message}`);
      } else if (stderr) {
        console.error(`stderr: ${stderr}`);
      } else {
        console.log(`Volume successfully set to ${clampedVol}`);
      }

      
      // Check if there's a newer pending volume to apply
      if (pendingVolume !== clampedVol && pendingVolume !== null) {
        const now = Date.now();
        const timeSinceLastChange = now - lastVolumeChange;
        const minInterval = 50;
        
        if (timeSinceLastChange >= minInterval) {
          executeVolumeChange();
        } else {
          volumeTimeout = setTimeout(executeVolumeChange, minInterval - timeSinceLastChange);
        }
      }
    });
  }
}
