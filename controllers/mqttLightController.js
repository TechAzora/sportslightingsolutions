const { asyncHandler } = require("../utils/asyncHandler");
const { Device, Light, LightType } = require("../models/siteModel");
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
  const lights = await Light.find({ pole: { $in: poleIds } }).populate({
    path: "lightType",
    populate: { path: "deviceId" },
  });

  const grouped = {};

  for (const light of lights) {
    const { lightType } = light;
    const device = lightType?.deviceId;
    if (!device) continue;

    const deviceSerial = device.serialNumber;
    const type = lightType.type;

    if (!grouped[deviceSerial]) grouped[deviceSerial] = {};
    if (!grouped[deviceSerial][type]) grouped[deviceSerial][type] = [];

    grouped[deviceSerial][type].push(light);
  }

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
const handleRandomLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds } = req.body; // expects array of pole IDs
  const poles = [...poleIds];

  for (const poleId of poles) {
    const grouped = await fetchGroupedLightsByPoles([poleId]);
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};

      for (const [type, lights] of Object.entries(types)) {
        const sorted = lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );

        if (type === "R") {
          response[deviceSerial][type] = sorted.map(() => 1);
        } else if (type === "X") {
          response[deviceSerial][type] = sorted.map(() => 100);
        } else if (type === "L") {
          response[deviceSerial][type] = {};
          sorted.forEach(
            (l) => (response[deviceSerial][type][l.serialNumber] = 100)
          );
        }
      }
    }

    const mqttResponse = await publishAndConfirm("pubtest", response);

    if (mqttResponse.received) {
      for (const typeLights of Object.values(grouped)) {
        for (const lights of Object.values(typeLights)) {
          for (const light of lights) {
            light.status = "1";
            light.brightness = 100;
            await light.save();
          }
        }
      }
    }

    await delay(1000);

    // Turn off all other poles' lights
    const otherLights = await Light.find({ pole: { $nin: [poleId] } });
    const offResponse = {};

    for (const light of otherLights) {
      const lightType = await LightType.findById(light.lightType).populate(
        "deviceId"
      );
      const deviceSerial = lightType.deviceId.serialNumber;
      const type = lightType.type;
      if (!offResponse[deviceSerial]) offResponse[deviceSerial] = {};

      if (type === "R") {
        if (!offResponse[deviceSerial][type])
          offResponse[deviceSerial][type] = [];
        offResponse[deviceSerial][type].push(0);
      } else if (type === "X") {
        if (!offResponse[deviceSerial][type])
          offResponse[deviceSerial][type] = [];
        offResponse[deviceSerial][type].push(0);
      } else if (type === "L") {
        if (!offResponse[deviceSerial][type])
          offResponse[deviceSerial][type] = {};
        offResponse[deviceSerial][type][light.serialNumber] = 0;
      }

      light.status = "0";
      light.brightness = 0;
      await light.save();
    }

    await publishAndConfirm("pubtest", offResponse);
    await delay(1000);
  }

  res.respond(200, "Random pattern simulation completed");
});

// Controller 2: Wave Lights by Poles
const handleWaveLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds } = req.body;
  for (const poleId of poleIds) {
    const grouped = await fetchGroupedLightsByPoles([poleId]);
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};
      for (const [type, lights] of Object.entries(types)) {
        const sorted = lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );

        for (let i = 0; i < sorted.length; i++) {
          const singleStep = JSON.parse(JSON.stringify(response));
          if (type === "R") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === i ? 1 : 0
            );
          } else if (type === "X") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === i ? 100 : 0
            );
          } else if (type === "L") {
            singleStep[deviceSerial][type] = {};
            sorted.forEach((l, idx) => {
              singleStep[deviceSerial][type][l.serialNumber] =
                idx === i ? 100 : 0;
            });
          }

          const mqttResponse = await publishAndConfirm("pubtest", singleStep);
          if (mqttResponse.received) {
            for (let j = 0; j < sorted.length; j++) {
              sorted[j].status = j === i ? "1" : "0";
              sorted[j].brightness = j === i ? 100 : 0;
              await sorted[j].save();
            }
          }
          await delay(500);
        }
      }
    }
  }
  res.respond(200, "Wave pattern simulation completed");
});

// Controller 3: Marquee Lights by Poles
const handleMarqueeLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed } = req.body; // expects array of pole IDs and speed (ms per step)

  for (const poleId of poleIds) {
    const grouped = await fetchGroupedLightsByPoles([poleId]);
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};
      for (const [type, lights] of Object.entries(types)) {
        const sorted = lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );

        let currentIndex = 0;

        for (let i = 0; i < sorted.length; i++) {
          const singleStep = JSON.parse(JSON.stringify(response));

          // Marquee effect
          if (type === "R") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === currentIndex ? 1 : 0
            );
          } else if (type === "X") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === currentIndex ? 100 : 0
            );
          } else if (type === "L") {
            singleStep[deviceSerial][type] = {};
            sorted.forEach((l, idx) => {
              singleStep[deviceSerial][type][l.serialNumber] =
                idx === currentIndex ? 100 : 0;
            });
          }

          // Publish the step
          const mqttResponse = await publishAndConfirm("pubtest", singleStep);
          if (mqttResponse.received) {
            for (let j = 0; j < sorted.length; j++) {
              sorted[j].status = j === currentIndex ? "1" : "0";
              sorted[j].brightness = j === currentIndex ? 100 : 0;
              await sorted[j].save();
            }
          }

          // Move to the next light in the sequence
          currentIndex = (currentIndex + 1) % sorted.length;
          await delay(speed); // Apply speed to control how fast the marquee moves
        }
      }
    }
  }
  res.respond(200, "Marquee pattern simulation completed");
});

// Controller 4: Chase Lights by Poles
const handleChaseLightsByPoles = asyncHandler(async (req, res) => {
  const { poleIds, speed } = req.body; // expects array of pole IDs and speed (ms per step)

  for (const poleId of poleIds) {
    const grouped = await fetchGroupedLightsByPoles([poleId]);
    const response = {};

    for (const [deviceSerial, types] of Object.entries(grouped)) {
      response[deviceSerial] = {};
      for (const [type, lights] of Object.entries(types)) {
        const sorted = lights.sort(
          (a, b) => parseInt(a.serialNumber) - parseInt(b.serialNumber)
        );

        let currentIndex = 0;

        for (let i = 0; i < sorted.length; i++) {
          const singleStep = JSON.parse(JSON.stringify(response));

          // Chase effect
          if (type === "R") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === currentIndex ? 1 : 0
            );
          } else if (type === "X") {
            singleStep[deviceSerial][type] = sorted.map((_, idx) =>
              idx === currentIndex ? 100 : 0
            );
          } else if (type === "L") {
            singleStep[deviceSerial][type] = {};
            sorted.forEach((l, idx) => {
              singleStep[deviceSerial][type][l.serialNumber] =
                idx === currentIndex ? 100 : 0;
            });
          }

          // Publish the step
          const mqttResponse = await publishAndConfirm("pubtest", singleStep);
          if (mqttResponse.received) {
            for (let j = 0; j < sorted.length; j++) {
              sorted[j].status = j === currentIndex ? "1" : "0";
              sorted[j].brightness = j === currentIndex ? 100 : 0;
              await sorted[j].save();
            }
          }

          // Move to the next light in the sequence
          currentIndex = (currentIndex + 1) % sorted.length;
          await delay(speed); // Apply speed to control how fast the chase moves
        }
      }
    }
  }
  res.respond(200, "Chase pattern simulation completed");
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
