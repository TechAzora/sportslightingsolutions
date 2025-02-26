const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const generateAccessAndRefereshTokens = asyncHandler(async (userId) => {
  const user = await Admin.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  await User.findByIdAndUpdate(
    userId,
    { refreshToken },
    { validateBeforeSave: false }
  );

  return { accessToken, refreshToken };
});

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

  res.respond(200, "Admin registered successfully!", admin);
});

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

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await Admin.findById(user._id);

  res.respond(200, "User logged In Successfully", {
    user: loggedInUser,
    accessToken,
    refreshToken,
  });
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.user, { refreshToken: null });

  res.respond(200, "User logged Out successfully!");
});

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

  const { accessToken, newRefreshToken } =
    await generateAccessAndRefereshTokens(user._id);

  res.respond(200, "Access token refreshed", {
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// const totalCounts = asyncHandler(async (req, res) => {
//   const totalClient = await Client.countDocuments();
//   const totalCase = await Case.countDocuments();
//   const totalWorkInProgress = await Case.countDocuments({ status: "pending" });
//   const totalInsufficient = await Case.countDocuments({ status: "failed" });
//   const totalFinal = await Case.countDocuments({ status: "complete" });

//   // Calculate Pending Revenue
//   const pendingCases = await Case.find({ status: "pending" }).populate(
//     "cheque"
//   );
//   const pendingRevenue = pendingCases.reduce((sum, caseItem) => {
//     return sum + (caseItem.cheque?.price || 0);
//   }, 0);

//   // Calculate Total Revenue
//   const completedCases = await Case.find({ status: "complete" }).populate(
//     "cheque"
//   );
//   const totalRevenue = completedCases.reduce((sum, caseItem) => {
//     return sum + (caseItem.cheque?.price || 0);
//   }, 0);

//   res.respond(200, "Total Counts Fetched!", {
//     totalClient,
//     totalCase,
//     totalWorkInProgress,
//     totalInsufficient,
//     totalFinal,
//     pendingRevenue,
//     totalRevenue,
//   });
// });

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  RefreshAccessToken,
  // totalCounts,
};
