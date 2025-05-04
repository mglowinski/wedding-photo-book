// Cloudinary configuration for browser environment
// Sign up for free at https://cloudinary.com/users/register/free

// We're not importing the full Cloudinary SDK since it has Node.js dependencies
// Instead, we'll just use the browser-compatible upload API

// Store Cloudinary configuration 
const cloudConfig = {
  cloud_name: 'dplt4mqsy',
  api_key: '641591769877653',
  api_secret: 'WxX2v1uvD9SP_uXGtpFXhTNW0FM',
  upload_preset: 'wedding_guestbook'
};

/**
 * Uploads a file to Cloudinary (browser-safe implementation)
 * @param file File to upload
 * @param folder Optional folder name
 * @returns Promise with the secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file: File, folder: string = 'uploads'): Promise<string> => {
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
        formData.append('upload_preset', cloudConfig.upload_preset);
        formData.append('folder', folder);
        
        // Upload using the upload preset (no API secret needed in browser)
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudConfig.cloud_name}/auto/upload`,
          {
            method: 'POST',
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

// Export the configuration for use in other components
export const cloudinaryConfig = cloudConfig; 