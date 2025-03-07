const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const validateOTP = require("../helper/validateOTP");
const sendOTP = require("../helper/sendOtp");
const generateOTP = require("../helper/generateOTP");

// ###############---------------Generate Access And Refresh Token---------------###############
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.respond(
      500,
      "Something went wrong while generating referesh and access token!"
    );
  }
};

// ####################--------------------AUTH--------------------####################
// ##########----------User Registration----------##########
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

  try {
    await sendOTP(phone, otp);
  } catch (error) {
    return res.respond(500, "Failed to send OTP. Please try again later.");
  }

  const user = await User.create({
    username,
    email,
    phone,
    designation,
    state,
    otp,
    otpExpiration: new Date(),
  });

  delete user._doc.otp;
  delete user._doc.otpExpiration;

  res.respond(201, "User registered successfully!", user);
});

// ##########----------User Login----------##########
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
  if (existingUser.status !== "approved") {
    return res.respond(
      403,
      "Your account has not been approved yet. Please try again later."
    );
  }

  const otp = await generateOTP();

  try {
    await sendOTP(phone, otp);
  } catch (error) {
    return res.respond(500, "Failed to send OTP. Please try again later.");
  }

  existingUser.otp = otp;
  existingUser.otpExpiration = new Date();
  await existingUser.save();

  res.respond(200, "User Sent Successfully!", {
    phone,
  });
});

// ##########----------User OTP Verification----------##########
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.respond(400, "phone number and OTP are required!");
  }

  if (!phone.match(/^[6789]\d{9}$/)) {
    return res.respond(400, "Invalid mobile number!");
  }

  const existingUser = await User.findOne({ phone, otp });
  if (!existingUser) {
    return res.respond(404, "Invalid OTP or Phone Number!");
  }

  const isOtpExpired = await validateOTP(existingUser.otpExpiration);
  if (isOtpExpired) {
    return res.respond(404, "OTP has Expired!");
  }

  if (existingUser.status !== "approved") {
    return res.respond(
      403,
      "Your account has not been approved yet. Please try again later."
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    existingUser._id
  );

  const user = await User.findById(existingUser._id);

  res.respond(200, "User Verified Successfully", {
    user,
    accessToken,
    refreshToken,
  });
});

// ##########----------User Logout----------##########
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user, { refreshToken: null });
  res.respond(200, "User logged Out Successfully!");
});

// ##########----------Refresh User's Access Token----------##########
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

  const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  res.respond(200, "Access token refreshed", {
    accessToken,
    refreshToken: newRefreshToken,
  });
});
// ####################--------------------AUTH End's Here--------------------####################

// ##########----------Update User's Profile----------##########
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { username, email, designation, state } = req.body;

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return res.respond(404, "User not found with this ID!");
  }

  existingUser.username = username;
  existingUser.email = email;
  existingUser.designation = designation;
  existingUser.state = state;
  await existingUser.save();

  res.respond(200, "User's Profile updated successfully!", existingUser);
});

// ##########----------Change User's status----------##########
const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.respond(400, "Status is required!");
  }

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return res.respond(404, "User not found with this ID!");
  }

  existingUser.status = status;
  await existingUser.save();

  res.respond(200, "User's status successfully updated!", existingUser);
});

// ##########----------Retrieve All Users----------##########
const getAllUsers = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    $or: [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ],
  };

  const totalUsers = await User.countDocuments();

  const users = await User.find(filter)
    .select("-otp -otpExpiration")
    .skip((page - 1) * limit)
    .limit(limit);

  res.respond(200, "Users fetched successfully", {
    totalCount: totalUsers,
    currentPageCount: users.length,
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    data: users,
  });
});

// ##########----------Get User's Profile----------##########
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user;
  const userProfile = await User.findById(userId).select("-otp -otpExpiration");
  if (!userProfile) {
    return res.respond(404, "User not found!");
  }

  res.respond(200, "User's Profile fetched successfully", userProfile);
});

// ##########----------Delete User's Profile----------##########
const deleteUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  await User.findByIdAndDelete(userId);

  res.respond(200, "User's Profile deleted successfully!");
});

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  logoutUser,
  RefreshAccessToken,
  updateUserProfile,
  updateUserStatus,
  getAllUsers,
  getUserProfile,
  deleteUserProfile,
};
