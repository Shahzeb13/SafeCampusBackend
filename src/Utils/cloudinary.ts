import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
export const uploadOnCloudinary = async (localFilePath: any) => {
    // Configure inside the function to ensure process.env is ready
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    try {
        if (!localFilePath) {
            console.log("No file path provided to Cloudinary utility");
            return null;
        }

        console.log("Cloudinary Config Check - Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME, "API Key Present:", !!process.env.CLOUDINARY_API_KEY);

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            transformation: [
              { height: 480, crop: "scale" },
              { quality: "auto" },
              { fetch_format: "auto" }
            ],
            timeout: 300000,
        });
        
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url);
        
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;

    } catch (error) {
        console.error("❌ Cloudinary Utility Error:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation failed
        }
        return null;
    }
}
