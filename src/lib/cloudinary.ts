// Cloudinary configuration
// Sign up for free at https://cloudinary.com/users/register/free

// Import the v2 api as per Cloudinary documentation
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with your credentials
// You'll need to sign up for a free account to get these values
cloudinary.config({
  cloud_name: 'dplt4mqsy', // Replace with your cloud name
  api_key: '641591769877653',       // Replace with your API key
  api_secret: 'WxX2v1uvD9SP_uXGtpFXhTNW0FM', // Replace with your API secret
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
        formData.append('upload_preset', 'wedding_guestbook'); // Using your custom preset
        formData.append('folder', folder);
        
        // Upload using the upload preset (no API secret needed in browser)
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/dplt4mqsy/auto/upload`,
          {
            method: 'POST',
            // Add CORS mode explicitly
            mode: 'cors',
            body: formData,
          }
        );
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error('Cloudinary error:', errorData);
          throw new Error(`Upload failed: ${uploadResponse.status} ${errorData}`);
        }
        
        const uploadResult = await uploadResponse.json();
        resolve(uploadResult.secure_url);
      } catch (error) {
        console.error('Upload error:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export default cloudinary; 