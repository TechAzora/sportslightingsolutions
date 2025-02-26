const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log("Database Connected successfully!");
  } catch (err) {
    console.error("Error connecting to database: ", err);
    process.exit(1);
  }
};

module.exports = connectDB;
