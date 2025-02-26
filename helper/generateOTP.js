const otpGenerator = require("otp-generator");

const generateOTP = async () => {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

module.exports = generateOTP;
