import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("Local file path is not provided");
            return null;
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("Upload successful:", response);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.error("Error during upload to Cloudinary:", error);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); 
        }

        return null;
    }
};

const deleteFileFromCloudinary = async (localFilePath, path = "image") => {
    try {
        if (!localFilePath) return null;
        console.log("file", localFilePath)
        const response = await cloudinary.uploader.destroy(localFilePath, {
            resource_type: path
        });
        console.log(response)
        return response;
    } catch (err) {
        console.error("Error deleting file from Cloudinary:", err);
        return null;
    }
};

export {uploadOnCloudinary,deleteFileFromCloudinary};