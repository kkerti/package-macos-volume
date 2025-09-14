let isEnabled = false;
let controller = undefined;
let messagePorts = new Set();
let fs = require("fs");
let path = require("path");
const { exec } = require("child_process");

let preferencePort = undefined;

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;

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
  console.log("hi");
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

function onVolumeChangeActionMessage(port, data) {
  console.log("onVolumeChangeActionMessage:", data);
}

function onPreferenceMessage(data) {
  console.log("Preference message:", data);
}

// Update the exports.sendMessage function
exports.sendMessage = async function (args) {
  let type = args[0];
  if (type === "input") {
    let vol = Number(args[1]);
    setVolumeQueued(vol);
  }
};

let isProcessing = false;
let latestVolume = null;

function setVolumeQueued(vol) {
  const clampedVol = Math.max(0, Math.min(100, vol));

  // Always store the latest volume
  latestVolume = clampedVol;

  // Start processing if not already processing
  if (!isProcessing) {
    processLatestVolume();
  }
}

function processLatestVolume() {
  if (latestVolume === null) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const vol = latestVolume;
  latestVolume = null; // Clear it immediately

  const command = `osascript -e "set volume output volume ${vol}"`;

  exec(command, { timeout: 2000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error setting volume: ${error.message}`);
    } else if (stderr) {
      console.error(`stderr: ${stderr}`);
    } else {
      console.log(`Volume set to ${vol}`);
    }

    // Check if there's a newer volume to process
    if (latestVolume !== null) {
      processLatestVolume();
    } else {
      isProcessing = false;
    }
  });
}
