// Cloudinary configuration
// Sign up for free at https://cloudinary.com/users/register/free

// Import the v2 api as per Cloudinary documentation
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with your credentials
// You'll need to sign up for a free account to get these values
cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME', // Replace with your cloud name
  api_key: 'YOUR_API_KEY',       // Replace with your API key
  api_secret: 'YOUR_API_SECRET', // Replace with your API secret
  secure: true                   // Use HTTPS
});

/**
 * Uploads a file to Cloudinary
 * @param file File to upload
 * @param options Upload options
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (file: File, folder: string = 'uploads'): Promise<string> => {
  // Convert file to base64 string
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      if (!reader.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      try {
        // Use fetch to upload to Cloudinary (browser-side)
        const base64Data = reader.result.toString().split(',')[1];
        
        // Create a FormData object
        const formData = new FormData();
        formData.append('file', `data:${file.type};base64,${base64Data}`);
        formData.append('upload_preset', 'wedding_guestbook'); // Create this in Cloudinary dashboard
        formData.append('folder', folder);
        
        // Upload using the upload preset (no API secret needed in browser)
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        resolve(uploadResult.secure_url);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export default cloudinary; 