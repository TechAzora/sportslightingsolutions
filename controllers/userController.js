const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const validateOTP = require("../helper/validateOTP");
const sendOTP = require("../helper/sendOtp");
const generateOTP = require("../helper/generateOTP");

const generateAccessAndRefereshTokens = asyncHandler(async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  await User.findByIdAndUpdate(
    userId,
    { refreshToken },
    { validateBeforeSave: false }
  );

  return { accessToken, refreshToken };
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, phone, designation, state } = req.body;

  if (!username || !email || !phone || !designation || !state) {
    return res.respond(400, "All fields required!");
  }

  if (!phone.match(/^[6789]\d{9}$/)) {
    return res.respond(400, "Invalid mobile number!");
  }

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    return res.respond(400, "User already exists with this phone!");
  }

  const otp = await generateOTP();
  await sendOTP(phone, otp);

  const user = await User.create({
    username,
    email,
    phone,
    designation,
    state,
    otp,
    otpExpiration: new Date(),
  });

  res.respond(200, "User registered successfully!", user);
});

const loginUser = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.respond(400, "phone number is required!");
  }

  if (!phone.match(/^[6789]\d{9}$/)) {
    return res.respond(400, "Invalid mobile number!");
  }

  const existingUser = await User.findOne({ phone });
  if (!existingUser) {
    return res.respond(404, "User not found with this phone number!");
  }

  const otp = await generateOTP();
  await sendOTP(phone, otp);

  res.respond(200, "User Sent Successfully!", {
    phone,
    otp,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.respond(400, "phone number and OTP are required!");
  }

  if (!phone.match(/^[6789]\d{9}$/)) {
    return res.respond(400, "Invalid mobile number!");
  }

  const existingUser = await User.findOne({ phone, otp });
  console.log(existingUser)
  if (!existingUser) {
    return res.respond(404, "Invalid OTP or Phone Number!");
  }

  const isOtpExpired = await validateOTP(existingUser.otpExpiration);
  if (isOtpExpired) {
    return res.respond(404, "OTP has Expired!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    existingUser._id
  );

  const user = await User.findById(existingUser._id);

  res.respond(200, "User Verified Successfully", {
    user,
    accessToken,
    refreshToken,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user, { refreshToken: null });
  res.respond(200, "User logged Out Successfully!");
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.respond(401, "unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return res.respond(401, "Invalid refresh token!");
  }

  const user = await User.findById(decodedToken?._id).select("refreshToken");
  if (!user || refreshToken !== user.refreshToken) {
    return res.respond(401, "Refresh token expired or invalid!");
  }

  const { accessToken, newRefreshToken } =
    await generateAccessAndRefereshTokens(user._id);

  res.respond(200, "Access token refreshed", {
    accessToken,
    refreshToken: newRefreshToken,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken -otp -otpExpiration"); 
  res.respond(200, "Users fetched successfully", users);
});

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  logoutUser,
  RefreshAccessToken,
  getAllUsers
};
