const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUDINARY,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = (folderName, fieldNames, maxCounts) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      console.log("Uploading File:", file.originalname, "Type:", file.mimetype); // Debugging

      // Determine resource type dynamically
      let resourceType = "auto"; // Default
      let format = undefined;

      const excelMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
      ];

      if (file.mimetype.startsWith("image/")) {
        resourceType = "image";
      } else if (file.mimetype === "application/pdf") {
        resourceType = "raw";
      } else if (excelMimeTypes.includes(file.mimetype)) {
        resourceType = "raw";
        format = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ? "xlsx"
          : "xls"; // Only define format if it's an Excel file
      }

      return {
        folder: folderName,
        resource_type: resourceType,
        format: format,
      };
    },
  });

  const upload = multer({ storage });

  // Prepare fields
  const fields = fieldNames.map((name, index) => ({
    name: name,
    maxCount: maxCounts[index] || 1,
  }));

  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err) {
        console.error("Upload Error:", err);
        return next({
          statusCode: err instanceof multer.MulterError ? 400 : 500,
          message: `Upload error: ${err.message}`,
        });
      }
      next();
    });
  };
};

module.exports = uploadToCloudinary;
