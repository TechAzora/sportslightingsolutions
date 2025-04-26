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

module.exports = {
  handleSingleLight,
  handleLight,
  handleLightsByTagId,
};
