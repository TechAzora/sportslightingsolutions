const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");

// ###############---------------Generate Access And Refresh Token---------------###############
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await Admin.findById(userId);
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
// ##########----------Admin Registration----------##########
const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.respond(400, "All fields required!");
  }

  const existingAdmin = await Admin.findOne({ email });
  const adminCount = await Admin.countDocuments();

  if (existingAdmin) {
    return res.respond(400, "Admin already exists with this email!");
  }

  if (adminCount >= 2) {
    return res.respond(400, "no more admins can be created");
  }

  const admin = await Admin.create({
    username,
    email,
    password,
  });

  res.respond(201, "Admin registered successfully!", admin);
});

// ##########----------Admin Login----------##########
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.respond(400, "username or email is required");
  }

  const user = await Admin.findOne({ email }).select("password");

  if (!user) {
    return res.respond(404, "User with this email not found!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res.respond(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await Admin.findById(user._id);

  res.respond(200, "User logged In Successfully", {
    user: loggedInUser,
    accessToken,
    refreshToken,
  });
});

// ##########----------Admin Logout----------##########
const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.user, { refreshToken: null });

  res.respond(200, "User logged Out successfully!");
});

// ##########----------Refresh Admin's Access Token----------##########
const RefreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.respond(401, "Unauthorized request!");

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return res.respond(401, "Invalid refresh token!");
  }

  const user = await Admin.findById(decoded._id).select("refreshToken");
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

// ##########----------Total Counts----------##########
const totalCounts = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();

  res.respond(200, "Total Counts Fetched Successfully!", {
    totalUsers,
  });
});

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  RefreshAccessToken,
  totalCounts,
};
