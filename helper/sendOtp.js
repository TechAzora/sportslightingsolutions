const axios = require("axios");

const sendOTP = async (phone, otp) => {
  const url = "https://www.fast2sms.com/dev/bulkV2";
  const payload = { variables_values: otp, route: "otp", numbers: phone };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        authorization: process.env.API_KEY,
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error?.response?.data || error.message);
    throw new Error("Failed to send OTP. Try again later.");
  }
};

module.exports = sendOTP;
