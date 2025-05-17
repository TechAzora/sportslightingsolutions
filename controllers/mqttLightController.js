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
    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
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
    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
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
      const lightTypes = await LightType.find({ deviceId: device._id }).populate("lights");

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
const mqttResponseQueue = [];

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

const initializeMQTTSubscription = ensureMQTTSubscribed();

const handleRandomLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, interval = 1000 } = req.body;

  const grouped = await fetchGroupedLightsByPoles(poleIds);

  // Respond immediately to client (acknowledging start)
  res.respond(200, "Random simulation started. Check server logs for MQTT activity.");

  // Initialize MQTT subscription only once
  initializeMQTTSubscription();

  // Infinite loop
  while (true) {
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};

      for (const [type, lights] of Object.entries(types)) {
        const randomLights = lights.filter(() => Math.random() > 0.5);

        if (type === "R" || type === "X") {
          response[deviceSerial][type] = lights.map(light =>
            randomLights.includes(light) ? (type === "R" ? 1 : 100) : 0
          );
        } else if (type === "L") {
          response[deviceSerial][type] = {};
          lights.forEach(light => {
            response[deviceSerial][type][light.serialNumber] = randomLights.includes(light) ? 100 : 0;
          });
        }

        // Update DB status and brightness
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

    // Log MQTT response if any
    if (mqttResponseQueue.length > 0) {
      const lastResponse = mqttResponseQueue.pop();
      console.log("Matching MQTT Response:", lastResponse);
    }

    // Wait before next loop
    await delay(interval);
  }
});

// Controller 2: Wave Lights by Poles
const handleWaveLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body;

  // Acknowledge start immediately
  res.respond(200, "Wave pattern simulation started. Running indefinitely...");

  // One-time MQTT subscription for incoming responses
  let subscribed = false;
  if (!subscribed) {
    subscribed = true;
    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
        console.log("MQTT Response:", incomingData);
      }
    });
  }

  // Start continuous wave effect
  while (true) {
    for (const poleId of poleIds) {
      const grouped = await fetchGroupedLightsByPoles([poleId]);

      for (const [deviceSerial, types] of Object.entries(grouped)) {
        for (const [type, lights] of Object.entries(types)) {
          const sorted = lights.sort(
            (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
          );

          for (let i = 0; i < sorted.length; i++) {
            const response = {};
            response[deviceSerial] = {};

            if (type === "R" || type === "X") {
              response[deviceSerial][type] = sorted.map((_, idx) =>
                idx === i ? (type === "R" ? 1 : 100) : 0
              );
            } else if (type === "L") {
              response[deviceSerial][type] = {};
              sorted.forEach((l, idx) => {
                response[deviceSerial][type][l.serialNumber] = idx === i ? 100 : 0;
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

            // Delay before next step
            await delay(speed);
          }
        }
      }
    }
  }
});


// Controller 3: Marquee Lights by Poles
const handleMarqueeLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body; // speed is delay in ms

  // Acknowledge start of marquee simulation
  res.respond(200, "Marquee pattern simulation started. Running indefinitely...");

  // Subscribe once to MQTT
  let subscribed = false;
  if (!subscribed) {
    subscribed = true;
    subscribeToMQTT("subtest", (incomingData) => {
      if (incomingData) {
        console.log("MQTT Response:", incomingData);
      }
    });
  }

  // Run marquee continuously
  while (true) {
    for (const poleId of poleIds) {
      const grouped = await fetchGroupedLightsByPoles([poleId]);

      for (const [deviceSerial, types] of Object.entries(grouped)) {
        for (const [type, lights] of Object.entries(types)) {
          const sorted = lights.sort(
            (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
          );

          for (let currentIndex = 0; currentIndex < sorted.length; currentIndex++) {
            const response = {};
            response[deviceSerial] = {};

            if (type === "R" || type === "X") {
              response[deviceSerial][type] = sorted.map((_, idx) =>
                idx === currentIndex ? (type === "R" ? 1 : 100) : 0
              );
            } else if (type === "L") {
              response[deviceSerial][type] = {};
              sorted.forEach((l, idx) => {
                response[deviceSerial][type][l.serialNumber] = idx === currentIndex ? 100 : 0;
              });
            }

            // Publish marquee pattern step
            await publishToMQTT("pubtest", response);

            // Update light states in DB
            for (let j = 0; j < sorted.length; j++) {
              const light = sorted[j];
              const isOn = j === currentIndex;
              light.status = isOn ? "1" : "0";
              light.brightness = isOn ? 100 : 0;
              await light.save();
            }

            // Delay before moving to next step
            await delay(speed);
          }
        }
      }
    }
  }
});


const handleChaseLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed = 500 } = req.body;

  res.respond(200, "Chase pattern simulation started. Running indefinitely...");

  const runChaseForPole = async (poleId) => {
    try {
      const grouped = await fetchGroupedLightsByPoles([poleId]);

      // Pre-sort lights per device/type once
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
        ...Object.values(sortedLightsByDeviceType).flatMap(device =>
          Object.values(device).map(lights => lights.length)
        )
      );

      while (true) {
        const singleStep = {};

        // Build the state for currentIndex
        for (const [deviceSerial, types] of Object.entries(sortedLightsByDeviceType)) {
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

        // Publish and update DB
        const mqttResponse = await publishAndConfirm("pubtest", singleStep);
        if (mqttResponse.received) {
          for (const types of Object.values(sortedLightsByDeviceType)) {
            for (const lights of Object.values(types)) {
              for (let j = 0; j < lights.length; j++) {
                lights[j].status = j === currentIndex ? "1" : "0";
                lights[j].brightness = j === currentIndex ? 100 : 0;
                await lights[j].save();
              }
            }
          }
        }

        currentIndex = (currentIndex + 1) % maxLength;
        await delay(speed);
      }
    } catch (err) {
      console.error(`Error in runChaseForPole for poleId ${poleId}:`, err);
    }
  };

  // Start all pole loops concurrently but don't await them so the handler finishes immediately
  poleIds.forEach(poleId => {
    setImmediate(() => {
      runChaseForPole(poleId);
    });
  });
});





module.exports = {
  handleSingleLight,
  handleLight,
  handleLightsByTagId,
  handleRandomLightsByPoles,
  handleChaseLightsByPoles,
  handleMarqueeLightsByPoles,
  handleWaveLightsByPoles,
};
