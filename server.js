const express = require("express");
const errorHandler = require("./utils/errorHandler");
const connectDB = require("./config/dbConnection");
const dotenv = require("dotenv");
const cors = require("cors");
const responseMiddleware = require("./utils/responseMiddleware");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(responseMiddleware);

app.use("/api", require("./routes"));

app.use(errorHandler);

app
  .listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Server Error:", err);
    process.exit(1);
  });
  // 