const asyncHandler = require("express-async-handler");
const { Device, Light, Pole } = require("../models/siteModel");

// ###############---------------Device Code Starts Here ---------------###############
// ##########----------Create Devices----------##########
const createDevices = asyncHandler(async (req, res) => {
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

// ###############---------------Light Code Starts Here ---------------###############
// ##########----------Create Lights----------##########
const createLights = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { serialNumber, tag, subTag } = req.body;

  if (!deviceId || !serialNumber || !tag || !subTag) {
    return res.respond(400, "Invalid Data!");
  }

  const createdLight = await Light.create({
    serialNumber,
    tag,
    subTag,
    deviceId,
  });

  await Device.findByIdAndUpdate(deviceId, {
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
  const { deviceId } = req.params;
  if (!deviceId) return res.respond(400, "deviceId is required!");

  const lights = await Light.find({ deviceId });

  res.respond(200, "Lights fetched successfully!", lights);
});

// ##########----------Delete Light----------##########
const deleteLight = asyncHandler(async (req, res) => {
  const { lightId } = req.params;

  const deletedLight = await Light.findByIdAndDelete(lightId);
  if (!deletedLight) return res.respond(404, "Light not found!");

  await Device.findByIdAndUpdate(deletedLight.deviceId, {
    $pull: { lights: lightId },
  });

  res.respond(200, "Light deleted successfully!", deletedLight);
});
// ###############---------------Light Code Ends Here ---------------###############

module.exports = {
  createDevices,
  updateDevice,
  getDevicesByPole,
  deleteDevice,
  createLights,
  updateLight,
  getLightsByDevice,
  deleteLight,
};
