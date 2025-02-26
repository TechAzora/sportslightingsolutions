const validateOTP = async (otpTime) => {
  try {
    const timeDiff = (new Date() - new Date(otpTime)) / (1000 * 60);
    return timeDiff > 2;
  } catch (error) {
    console.error("Error validating OTP:", error.message);
    return true;
  }
};

module.exports = validateOTP;
