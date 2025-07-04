const { asyncHandler } = require("../utils/asyncHandler");
const { Device, Light, LightType, Pole } = require("../models/siteModel");
const { publishToMQTT, subscribeToMQTT } = require("../utils/mqttHandler");

// ##########----------Handle Single Light----------##########
const handleSingleLight = asyncHandler(async (req, res) => {
  const { lightId } = req.params;
  const { status } = req.body;

  // 1. Find the target light
  const light = await Light.findById(lightId);
  if (!light) return res.status(404).json({ message: "Light not found" });

  // 2. Get the LightType and populate its lights
  const lightType = await LightType.findById(light.lightType)
    .populate("lights")
    .populate("deviceId");
  if (!lightType)
    return res.status(404).json({ message: "LightType not found" });

  const device = lightType.deviceId;
  if (!device) return res.status(404).json({ message: "Device not found" });

  // 3. Sort lights by serialNumber (numeric)
  const sortedLights = lightType.lights.sort((a, b) => {
    return parseInt(a.serialNumber) - parseInt(b.serialNumber);
  });

  const type = lightType.type;
  const deviceSerial = device.serialNumber;

  let lightData;

  // 4. Format data based on type
  if (type === "R") {
    lightData = sortedLights.map((l) => (l.status === "1" ? 1 : 0));
  } else if (type === "X") {
    lightData = sortedLights.map((l) => l.brightness || 0);
  } else if (type === "L") {
    lightData = {};
    sortedLights.forEach((l) => {
      lightData[l.serialNumber] = l.brightness || 0;
    });
  }

  // 5. Construct final response
  const response = {
    [deviceSerial]: {
      [type]: lightData,
    },
  };

  // ########## Publish to MQTT ##########
  await publishToMQTT("pubtest", response);

  // ########## Wait for MQTT response (using Promise) ##########
  const mqttResponse = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("MQTT response timeout"));
    }, 5000);

    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
        clearTimeout(timeout);
        resolve(incomingData);
      } else {
        reject(new Error("No MQTT response received"));
      }
    });
  });

  console.log("Received from MQTT:", mqttResponse);

  if (mqttResponse.received) {
    await Light.findByIdAndUpdate(lightId, {
      status: status,
    });

    return res.respond(200, "Light status updated successfully!", {
      updated: true,
    });
  } else {
    return res.respond(400, "Device responded with failure", {
      updated: false,
    });
  }
});

// ##########----------Handle Lights By Tag ID----------##########
const handleLightsByTagId = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { brightness } = req.body;

  // 1. Find all lights with the given tag ID and populate necessary references
  const lights = await Light.find({ tag: tagId }).populate({
    path: "lightType",
    populate: {
      path: "deviceId",
    },
  });

  if (lights.length === 0) {
    return res.status(404).json({ message: "No lights found for this tag" });
  }

  // 2. Group lights by device serial and light type
  const grouped = {};

  lights.forEach((light) => {
    const lightType = light.lightType;
    const device = lightType?.deviceId;

    if (!lightType || !device) return;

    const deviceSerial = device.serialNumber;
    const type = lightType.type;

    if (!grouped[deviceSerial]) {
      grouped[deviceSerial] = {};
    }

    if (!grouped[deviceSerial][type]) {
      grouped[deviceSerial][type] = [];
    }

    grouped[deviceSerial][type].push(light);
  });

  // 3. Format response
  const response = {};

  for (const [deviceSerial, types] of Object.entries(grouped)) {
    response[deviceSerial] = {};

    for (const [type, lightsArray] of Object.entries(types)) {
      const sorted = lightsArray.sort(
        (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
      );

      if (type === "R") {
        response[deviceSerial][type] = sorted.map((l) =>
          l.status === "1" ? 1 : 0
        );
      } else if (type === "X") {
        response[deviceSerial][type] = sorted.map((l) => l.brightness || 0);
      } else if (type === "L") {
        response[deviceSerial][type] = {};
        sorted.forEach((l) => {
          response[deviceSerial][type][l.serialNumber] = l.brightness || 0;
        });
      }
    }
  }

  // ########## NEW CODE: Publish response to MQTT ##########
  await publishToMQTT("pubtest", response);

  // ########## Wait for MQTT response (with Promise) ##########
  const mqttResponse = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("MQTT response timeout"));
    }, 5000);

    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
        clearTimeout(timeout);
        resolve(incomingData);
      } else {
        reject(new Error("No MQTT response received"));
      }
    });
  });
  console.log("Incoming subscribed data:", mqttResponse);

  if (mqttResponse.received) {
    await Promise.all(
      lights.map(async (light) => {
        if (brightness !== undefined && brightness !== null) {
          light.brightness = brightness;
          light.status = brightness > 0 ? "1" : "0";
        }
        await light.save();
      })
    );
    console.log("Lights updated successfully after MQTT confirmation.");
  } else {
    console.error("MQTT response indicated failure:", incomingData);
  }

  res.respond(200, "Handle Lights By Tag Id!", response);
});

// ##########----------Handle Light----------##########
const handleLight = asyncHandler(async (req, res) => {
  const devices = await Device.find();

  const response = {};

  for (const device of devices) {
    const lightTypes = await LightType.find({ deviceId: device._id }).populate(
      "lights"
    );

    const deviceData = {};

    for (const lt of lightTypes) {
      const type = lt.type;

      if (type === "R") {
        // Relay - only include available lights, ordered by serialNumber
        const relayArray = [];
        const sorted = lt.lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );
        sorted.forEach((light) => {
          relayArray.push(light.status === "1" ? 1 : 0);
        });
        deviceData["R"] = relayArray;
      } else if (type === "X") {
        // DMX - brightness values ordered by serialNumber
        const sorted = lt.lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );
        const dmxArray = sorted.map((light) => light.brightness || 0);
        deviceData["X"] = dmxArray;
      } else if (type === "L") {
        // DALI - { serialNumber: brightness }
        const daliMap = {};
        lt.lights.forEach((light) => {
          daliMap[light.serialNumber] = light.brightness || 0;
        });
        deviceData["L"] = daliMap;
      }
    }

    if (Object.keys(deviceData).length > 0) {
      response[device.serialNumber] = deviceData;
    }
  }

  res.respond(201, "Turn on the light!", response);
});

// Utility to fetch and group lights by device/type from pole IDs
const fetchGroupedLightsByPoles = async (poleIds) => {
  const poles = await Pole.find({ _id: { $in: poleIds } }).populate("devices");

  const grouped = {};

  for (const pole of poles) {
    for (const device of pole.devices) {
      const lightTypes = await LightType.find({
        deviceId: device._id,
      }).populate("lights");

      for (const lt of lightTypes) {
        const deviceSerial = device.serialNumber;
        const type = lt.type;

        if (!grouped[deviceSerial]) grouped[deviceSerial] = {};
        if (!grouped[deviceSerial][type]) grouped[deviceSerial][type] = [];

        grouped[deviceSerial][type].push(...lt.lights);
      }
    }
  }
  console.log(grouped);

  return grouped;
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const publishAndConfirm = async (topic, payload) => {
  await publishToMQTT(topic, payload);
  const mqttResponse = await new Promise((resolve, reject) => {
    subscribeToMQTT("subtest", (incomingData) => {
      incomingData ? resolve(incomingData) : reject("No MQTT response");
    });
  });
  return mqttResponse;
};

// Controller 1: Random Lights by Pole
// Shared response queue
// const mqttResponseQueue = [];

// Subscribe once — to be called before entering the loop
const ensureMQTTSubscribed = () => {
  let alreadySubscribed = false;

  return () => {
    if (alreadySubscribed) return;
    alreadySubscribed = true;

    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
        mqttResponseQueue.push(incomingData);
        console.log("MQTT Response Received:", incomingData);
      }
    });
  };
};

// const initializeMQTTSubscription = ensureMQTTSubscribed();

let isRandomLightsRunning = false;

const mqttResponseQueue = [];

const initializeMQTTSubscription = (() => {
  let alreadySubscribed = false;

  return () => {
    if (alreadySubscribed) return;
    alreadySubscribed = true;

    subscribeToMQTT("subtest", async (incomingData) => {
      if (incomingData) {
        mqttResponseQueue.push(incomingData);
        console.log("MQTT Response Received:", incomingData);

        // Parse and update lights in DB based on incomingData
        try {
          // incomingData assumed to be JSON string, parse it:
          const data =
            typeof incomingData === "string"
              ? JSON.parse(incomingData)
              : incomingData;

          for (const [deviceSerial, types] of Object.entries(data)) {
            for (const [type, values] of Object.entries(types)) {
              if (type === "R" || type === "X") {
                // values is an array of brightness values for each light
                for (let i = 0; i < values.length; i++) {
                  const brightness = values[i];
                  // Find light by deviceSerial, type and index (serialNumber may not be index, so be careful)
                  // To be safe, find lights by deviceSerial & type first
                  const lightType = await LightType.findOne({
                    type,
                    deviceSerial,
                  }).populate("lights");
                  if (!lightType) continue;
                  const light = lightType.lights[i];
                  if (!light) continue;

                  light.status = brightness > 0 ? "1" : "0";
                  light.brightness = brightness;
                  await light.save();
                }
              } else if (type === "L") {
                // values is an object { lightSerialNumber: brightness }
                for (const [lightSerial, brightness] of Object.entries(
                  values
                )) {
                  const light = await Light.findOne({
                    serialNumber: lightSerial,
                  });
                  if (!light) continue;

                  light.status = brightness > 0 ? "1" : "0";
                  light.brightness = brightness;
                  await light.save();
                }
              }
            }
          }
        } catch (err) {
          console.error("Error updating lights on MQTT response:", err);
        }
      }
    });
  };
})();

const handleRandomLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, interval = 1000 } = req.body;

  if (isRandomLightsRunning) {
    return res
      .status(400)
      .json({ message: "Random lights simulation already running." });
  }

  isRandomLightsRunning = true;

  const grouped = await fetchGroupedLightsByPoles(poleIds);

  // Respond immediately to client (acknowledging start)
  res.status(200).json({
    message: "Random simulation started. Check server logs for MQTT activity.",
  });

  // Initialize MQTT subscription only once
  initializeMQTTSubscription();

  while (isRandomLightsRunning) {
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};

      for (const [type, lights] of Object.entries(types)) {
        const randomLights = lights.filter(() => Math.random() > 0.5);

        if (type === "R" || type === "X") {
          response[deviceSerial][type] = lights.map((light) =>
            randomLights.includes(light) ? (type === "R" ? 1 : 100) : 0
          );
        } else if (type === "L") {
          response[deviceSerial][type] = {};
          lights.forEach((light) => {
            response[deviceSerial][type][light.serialNumber] =
              randomLights.includes(light) ? 100 : 0;
          });
        }

        // Update DB status and brightness locally too (optional, you can rely on MQTT response update instead)
        for (const light of lights) {
          const isOn = randomLights.includes(light);
          light.status = isOn ? "1" : "0";
          light.brightness = isOn ? 100 : 0;
          await light.save();
        }
      }
    }

    // Publish random pattern
    await publishToMQTT("pubtest", response);

    // Process any MQTT response queued
    while (mqttResponseQueue.length > 0) {
      const lastResponse = mqttResponseQueue.shift();
      console.log("Processing MQTT Response:", lastResponse);
      // DB update handled in subscription callback
    }

    // Wait before next loop
    await delay(interval);
  }

  console.log("Random lights simulation stopped.");
});

// New controller to stop the simulation
const stopRandomLightsByPoles = asyncHandler(async (req, res) => {
  if (!isRandomLightsRunning) {
    return res
      .status(400)
      .json({ message: "Random lights simulation is not running." });
  }

  isRandomLightsRunning = false;
  res.status(200).json({ message: "Random lights simulation stopped." });
});

let isWaveLightsRunning = false;

const initializeWaveMQTTSubscription = (() => {
  let subscribed = false;
  return () => {
    if (subscribed) return;
    subscribed = true;

    subscribeToMQTT("subtest", async (incomingData) => {
      if (incomingData) {
        mqttResponseQueue.push(incomingData);
        console.log("MQTT Response (Wave):", incomingData);

        try {
          const data =
            typeof incomingData === "string"
              ? JSON.parse(incomingData)
              : incomingData;

          for (const [deviceSerial, types] of Object.entries(data)) {
            for (const [type, values] of Object.entries(types)) {
              if (type === "R" || type === "X") {
                for (let i = 0; i < values.length; i++) {
                  const brightness = values[i];
                  const lightType = await LightType.findOne({
                    type,
                    deviceSerial,
                  }).populate("lights");
                  if (!lightType) continue;
                  const light = lightType.lights[i];
                  if (!light) continue;

                  light.status = brightness > 0 ? "1" : "0";
                  light.brightness = brightness;
                  await light.save();
                }
              } else if (type === "L") {
                for (const [lightSerial, brightness] of Object.entries(
                  values
                )) {
                  const light = await Light.findOne({
                    serialNumber: lightSerial,
                  });
                  if (!light) continue;

                  light.status = brightness > 0 ? "1" : "0";
                  light.brightness = brightness;
                  await light.save();
                }
              }
            }
          }
        } catch (err) {
          console.error("Error updating lights on MQTT response (Wave):", err);
        }
      }
    });
  };
})();

const handleWaveLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body;

  if (isWaveLightsRunning) {
    return res
      .status(400)
      .json({ message: "Wave lights simulation already running." });
  }

  isWaveLightsRunning = true;

  // Acknowledge immediately
  res.status(200).json({
    message: "Wave pattern simulation started. Running indefinitely...",
  });

  // Initialize MQTT subscription only once
  initializeWaveMQTTSubscription();

  while (isWaveLightsRunning) {
    for (const poleId of poleIds) {
      const grouped = await fetchGroupedLightsByPoles([poleId]);

      for (const [deviceSerial, types] of Object.entries(grouped)) {
        for (const [type, lights] of Object.entries(types)) {
          const sorted = lights.sort(
            (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
          );

          for (let i = 0; i < sorted.length && isWaveLightsRunning; i++) {
            const response = {};
            response[deviceSerial] = {};

            if (type === "R" || type === "X") {
              response[deviceSerial][type] = sorted.map((_, idx) =>
                idx === i ? (type === "R" ? 1 : 100) : 0
              );
            } else if (type === "L") {
              response[deviceSerial][type] = {};
              sorted.forEach((l, idx) => {
                response[deviceSerial][type][l.serialNumber] =
                  idx === i ? 100 : 0;
              });
            }

            // Publish current step to MQTT
            await publishToMQTT("pubtest", response);

            // Save state in DB
            for (let j = 0; j < sorted.length; j++) {
              const light = sorted[j];
              const isOn = j === i;
              light.status = isOn ? "1" : "0";
              light.brightness = isOn ? 100 : 0;
              await light.save();
            }

            // Process any MQTT response queued (optional)
            while (mqttResponseQueue.length > 0) {
              const lastResponse = mqttResponseQueue.shift();
              console.log("Processing MQTT Response (Wave):", lastResponse);
              // DB update handled in subscription callback
            }

            // Delay before next step
            await delay(speed);
          }
        }
      }
    }
  }

  console.log("Wave lights simulation stopped.");
});

// Controller to stop the wave simulation
const stopWaveLightsByPoles = asyncHandler(async (req, res) => {
  if (!isWaveLightsRunning) {
    return res
      .status(400)
      .json({ message: "Wave lights simulation is not running." });
  }

  isWaveLightsRunning = false;
  res.status(200).json({ message: "Wave lights simulation stopped." });
});

let isMarqueeRunning = false;

// Subscribe once globally
let subscribed = false;
if (!subscribed) {
  subscribed = true;
  subscribeToMQTT("subtest", async (incomingData) => {
    if (incomingData) {
      console.log("MQTT Response:", incomingData);

      for (const [deviceSerial, types] of Object.entries(incomingData)) {
        for (const [type, lightData] of Object.entries(types)) {
          if (type === "R" || type === "X") {
            for (let i = 0; i < lightData.length; i++) {
              const brightness = lightData[i];
              const status = brightness > 0 ? "1" : "0";
              const light = await LightModel.findOne({
                deviceSerial,
                type,
                index: i,
              });
              if (light) {
                light.status = status;
                light.brightness = brightness;
                await light.save();
              }
            }
          } else if (type === "L") {
            for (const [serialNumber, brightness] of Object.entries(
              lightData
            )) {
              const status = brightness > 0 ? "1" : "0";
              const light = await LightModel.findOne({
                deviceSerial,
                type,
                serialNumber,
              });
              if (light) {
                light.status = status;
                light.brightness = brightness;
                await light.save();
              }
            }
          }
        }
      }
    }
  });
}

const handleMarqueeLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body;

  if (isMarqueeRunning) {
    return res
      .status(400)
      .json({ message: "Marquee simulation is already running." });
  }

  isMarqueeRunning = true;
  res.respond(
    200,
    "Marquee pattern simulation started. Running indefinitely..."
  );

  const runMarquee = async () => {
    try {
      while (isMarqueeRunning) {
        for (const poleId of poleIds) {
          const grouped = await fetchGroupedLightsByPoles([poleId]);

          for (const [deviceSerial, types] of Object.entries(grouped)) {
            for (const [type, lights] of Object.entries(types)) {
              const sorted = lights.sort(
                (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
              );

              for (
                let currentIndex = 0;
                currentIndex < sorted.length && isMarqueeRunning;
                currentIndex++
              ) {
                const response = {};
                response[deviceSerial] = {};

                if (type === "R" || type === "X") {
                  response[deviceSerial][type] = sorted.map((_, idx) =>
                    idx === currentIndex ? (type === "R" ? 1 : 100) : 0
                  );
                } else if (type === "L") {
                  response[deviceSerial][type] = {};
                  sorted.forEach((l, idx) => {
                    response[deviceSerial][type][l.serialNumber] =
                      idx === currentIndex ? 100 : 0;
                  });
                }

                await publishToMQTT("pubtest", response);
                await delay(speed);
              }
            }
          }
        }
      }

      console.log("Marquee simulation stopped.");
    } catch (error) {
      console.error("Error in Marquee simulation:", error);
      isMarqueeRunning = false;
    }
  };

  runMarquee();
});

// Controller to stop marquee
const stopMarqueeLightsByPoles = asyncHandler(async (req, res) => {
  if (!isMarqueeRunning) {
    return res.status(400).json({ message: "No marquee simulation running." });
  }

  isMarqueeRunning = false;
  res.status(200).json({ message: "Marquee simulation stopped." });
});

let isChaseLightsRunning = false;

const handleChaseLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body;

  if (isChaseLightsRunning) {
    return res
      .status(400)
      .json({ message: "Chase simulation already running." });
  }
  isChaseLightsRunning = true;

  res.status(200).json({
    message: "Chase pattern simulation started. Running indefinitely...",
  });

  // Subscribe once (if not already subscribed)
  if (!handleChaseLightsByPoles.mqttSubscribed) {
    subscribeToMQTT("subtest", async (incomingData) => {
      // Assuming incomingData contains deviceSerial, light serial number, status, brightness info
      if (incomingData) {
        console.log("MQTT Response received:", incomingData);
        // Parse and update DB accordingly:
        // incomingData example: { deviceSerial: { type: { serialNumber: statusValue } } }
        for (const [deviceSerial, types] of Object.entries(incomingData)) {
          for (const [type, lights] of Object.entries(types)) {
            if (typeof lights === "object") {
              for (const [serialNumber, value] of Object.entries(lights)) {
                // Find the light document and update
                const light = await LightModel.findOne({
                  deviceSerial,
                  type,
                  serialNumber,
                });
                if (light) {
                  light.status = value > 0 ? "1" : "0";
                  light.brightness = value;
                  await light.save();
                }
              }
            }
          }
        }
      }
    });
    handleChaseLightsByPoles.mqttSubscribed = true;
  }

  const runChaseForPole = async (poleId) => {
    try {
      const grouped = await fetchGroupedLightsByPoles([poleId]);

      const sortedLightsByDeviceType = {};
      for (const [deviceSerial, types] of Object.entries(grouped)) {
        sortedLightsByDeviceType[deviceSerial] = {};
        for (const [type, lights] of Object.entries(types)) {
          sortedLightsByDeviceType[deviceSerial][type] = lights.sort(
            (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
          );
        }
      }

      let currentIndex = 0;
      const maxLength = Math.max(
        ...Object.values(sortedLightsByDeviceType).flatMap((device) =>
          Object.values(device).map((lights) => lights.length)
        )
      );

      while (isChaseLightsRunning) {
        const singleStep = {};

        for (const [deviceSerial, types] of Object.entries(
          sortedLightsByDeviceType
        )) {
          singleStep[deviceSerial] = {};

          for (const [type, sortedLights] of Object.entries(types)) {
            if (type === "R") {
              singleStep[deviceSerial][type] = sortedLights.map((_, idx) =>
                idx === currentIndex ? 1 : 0
              );
            } else if (type === "X") {
              singleStep[deviceSerial][type] = sortedLights.map((_, idx) =>
                idx === currentIndex ? 100 : 0
              );
            } else if (type === "L") {
              singleStep[deviceSerial][type] = {};
              sortedLights.forEach((l, idx) => {
                singleStep[deviceSerial][type][l.serialNumber] =
                  idx === currentIndex ? 100 : 0;
              });
            }
          }
        }

        // Publish current step (don't update DB here, wait for MQTT response)
        await publishToMQTT("pubtest", singleStep);

        currentIndex = (currentIndex + 1) % maxLength;
        await delay(speed);
      }

      console.log("Chase lights simulation stopped for pole", poleId);
    } catch (err) {
      console.error(`Error in runChaseForPole for poleId ${poleId}:`, err);
    }
  };

  // Run loops concurrently
  poleIds.forEach((poleId) => {
    setImmediate(() => {
      runChaseForPole(poleId);
    });
  });
});

// New controller to stop the simulation
const stopChaseLightsByPoles = asyncHandler(async (req, res) => {
  if (!isChaseLightsRunning) {
    return res
      .status(400)
      .json({ message: "Chase lights simulation is not running." });
  }
  isChaseLightsRunning = false;
  res.status(200).json({ message: "Chase lights simulation stopped." });
});

const handleSetRelayBrightnessByPoles = asyncHandler(async (req, res) => {
  const { poleIds, brightness = 100 } = req.body;

  if (
    !poleIds ||
    !Array.isArray(poleIds) ||
    brightness < 0 ||
    brightness > 100
  ) {
    return res.status(400).json({ message: "Invalid input." });
  }

  // Fetch relay lights by pole IDs
  const grouped = await fetchGroupedLightsByPoles(poleIds);

  const mqttPayload = {};
  const lightsToUpdate = [];

  for (const [deviceSerial, types] of Object.entries(grouped)) {
    if (!types.R) continue; // Only relay lights

    // Sort lights by subTag or serialNumber to maintain consistent order
    const sortedLights = types.R.sort((a, b) =>
      String(a.subTag || "").localeCompare(String(b.subTag || ""))
    );

    const totalLights = sortedLights.length;
    const lightsToTurnOn = Math.round((brightness / 100) * totalLights);

    mqttPayload[deviceSerial] = { R: [] };

    for (let i = 0; i < sortedLights.length; i++) {
      const isOn = i < lightsToTurnOn;

      mqttPayload[deviceSerial].R.push(isOn ? 1 : 0);

      sortedLights[i].status = isOn ? "1" : "0";
      sortedLights[i].brightness = isOn ? 100 : 0;
      lightsToUpdate.push(sortedLights[i].save());
    }
  }

  // Publish to MQTT
  await publishToMQTT("pubtest", mqttPayload);

  // Save DB state
  await Promise.all(lightsToUpdate);

  return res.respond(200, "Relay brightness updated based on illusion.");
});

module.exports = {
  handleSingleLight,
  handleLight,
  handleLightsByTagId,
  handleRandomLightsByPoles,
  stopRandomLightsByPoles,
  handleChaseLightsByPoles,
  stopChaseLightsByPoles,
  handleMarqueeLightsByPoles,
  stopMarqueeLightsByPoles,
  handleWaveLightsByPoles,
  stopWaveLightsByPoles,
  handleSetRelayBrightnessByPoles,
};
