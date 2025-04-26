const { asyncHandler } = require("../utils/asyncHandler");
const { Device, Light, Pole, LightType } = require("../models/siteModel");

// ###############---------------Device Code Starts Here ---------------###############
// ##########----------Create Devices----------##########
const createDevice = asyncHandler(async (req, res) => {
  const { poleId } = req.params;
  const { serialNumber, deviceType } = req.body;

  if (!poleId || !serialNumber || !deviceType) {
    return res.respond(400, "Invalid Data!");
  }

  const createdDevice = await Device.create({
    serialNumber,
    deviceType,
    poleId,
  });

  await Pole.findByIdAndUpdate(poleId, {
    $addToSet: { devices: createdDevice._id },
  });

  res.respond(201, "Device created successfully!", createdDevice);
});

// ##########----------Update Device----------##########
const updateDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { serialNumber, deviceType } = req.body;

  const updatedDevice = await Device.findByIdAndUpdate(
    deviceId,
    { serialNumber, deviceType },
    {
      new: true,
    }
  );

  if (!updatedDevice) return res.respond(404, "Device not found!");

  res.respond(200, "Device updated successfully!", updatedDevice);
});

// ##########----------Get Devices By Pole----------##########
const getDevicesByPole = asyncHandler(async (req, res) => {
  const { poleId } = req.params;
  if (!poleId) return res.respond(400, "poleId is required!");

  const devices = await Device.find({ poleId }).populate("lights");

  res.respond(200, "Devices fetched successfully!", devices);
});

// ##########----------Delete Device----------##########
const deleteDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;

  const deletedDevice = await Device.findByIdAndDelete(deviceId);
  if (!deletedDevice) return res.respond(404, "Device not found!");

  await Pole.findByIdAndUpdate(deletedDevice.poleId, {
    $pull: { devices: deviceId },
  });

  res.respond(200, "Device deleted successfully!", deletedDevice);
});
// ###############---------------Device Code Ends Here ---------------###############

// ###############---------------Light Type Code Starts Here ---------------###############
// ##########----------Create Light Type----------##########
const createLightType = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { type } = req.body;

  if (!deviceId || !type) {
    return res.respond(400, "Invalid Data!");
  }

  const createdLightType = await LightType.create({
    deviceId,
    type,
  });

  res.respond(201, "Light Type created successfully!", createdLightType);
});

// ##########----------Update Light Type----------##########
const updateLightType = asyncHandler(async (req, res) => {
  const { lightTypeId } = req.params;
  const { type } = req.body;

  const updatedLightType = await LightType.findByIdAndUpdate(
    lightTypeId,
    { type },
    { new: true }
  );

  if (!updatedLightType) return res.respond(404, "Light Type not found!");

  res.respond(200, "Light Type updated successfully!", updatedLightType);
});

// ##########----------Get Light Types By Device----------##########
const getLightTypesByDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) return res.respond(400, "deviceId is required!");

  const lightTypes = await LightType.find({ deviceId }).populate("lights");

  res.respond(200, "Light Types fetched successfully!", lightTypes);
});

// ##########----------Delete Light Type----------##########
const deleteLightType = asyncHandler(async (req, res) => {
  const { lightTypeId } = req.params;

  const deletedLightType = await LightType.findByIdAndDelete(lightTypeId);
  if (!deletedLightType) return res.respond(404, "Light Type not found!");

  res.respond(200, "Light Type deleted successfully!", deletedLightType);
});

// ###############---------------Device Code Ends Here ---------------###############

// ###############---------------Light Code Starts Here ---------------###############
// ##########----------Create Lights----------##########
const createLight = asyncHandler(async (req, res) => {
  const { lightType } = req.params;
  const { serialNumber, tag, subTag } = req.body;

  if (!lightType || !serialNumber || !tag || !subTag) {
    return res.respond(400, "Invalid Data!");
  }

  const createdLight = await Light.create({
    serialNumber,
    tag,
    subTag,
    lightType,
  });

  await LightType.findByIdAndUpdate(lightType, {
    $addToSet: { lights: createdLight._id },
  });

  res.respond(201, "Lights created successfully!", createdLight);
});

// ##########----------Update Light----------##########
const updateLight = asyncHandler(async (req, res) => {
  const { lightId } = req.params;
  const { serialNumber, tag, subTag } = req.body;

  const updatedLight = await Light.findByIdAndUpdate(
    lightId,
    {
      serialNumber,
      tag,
      subTag,
    },
    {
      new: true,
    }
  );

  if (!updatedLight) return res.respond(404, "Light not found!");

  res.respond(200, "Light updated successfully!", updatedLight);
});

// ##########----------Get Lights By Device----------##########
const getLightsByDevice = asyncHandler(async (req, res) => {
  const { lightType } = req.params;
  if (!lightType) return res.respond(400, "lightType is required!");

  const lights = await Light.find({ lightType });

  res.respond(200, "Lights fetched successfully!", lights);
});

// ##########----------Delete Light----------##########
const deleteLight = asyncHandler(async (req, res) => {
  const { lightId } = req.params;

  const deletedLight = await Light.findByIdAndDelete(lightId);
  if (!deletedLight) return res.respond(404, "Light not found!");

  await LightType.findByIdAndUpdate(deletedLight.lightType, {
    $pull: { lights: lightId },
  });

  res.respond(200, "Light deleted successfully!", deletedLight);
});
// ###############---------------Light Code Ends Here ---------------###############

module.exports = {
  createDevice,
  updateDevice,
  getDevicesByPole,
  deleteDevice,
  createLightType,
  updateLightType,
  getLightTypesByDevice,
  deleteLightType,
  createLight,
  updateLight,
  getLightsByDevice,
  deleteLight,
};
