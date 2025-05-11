// Cloudinary configuration for browser environment
// Sign up for free at https://cloudinary.com/users/register/free

// We're not importing the full Cloudinary SDK since it has Node.js dependencies
// Instead, we'll just use the browser-compatible upload API

// Store Cloudinary configuration 
export const cloudinaryConfig = {
  cloud_name: 'dplt4mqsy',
  api_key: '641591769877653',
  api_secret: 'WxX2v1uvD9SP_uXGtpFXhTNW0FM',
  upload_preset: 'wedding_guestbook'
};

// Free CORS proxies (use as fallback when direct upload fails)
const corsProxies = [
  'https://corsproxy.io/?',  // Good reliable option
  'https://cors-anywhere.herokuapp.com/',  // Requires temporary access
  'https://api.allorigins.win/raw?url='  // Another option
];

/**
 * Uploads a file to Cloudinary using our server API route
 * This bypasses CORS issues by making the request from the server
 */
export const uploadToCloudinary = async (file: File, folder: string = 'uploads'): Promise<string> => {
  try {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // Use our Next.js API route to upload the file
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API upload failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    
    // If the API route fails, fall back to direct upload methods
    return legacyUploadToCloudinary(file, folder);
  }
};

/**
 * Legacy method that tries multiple direct upload approaches
 * Only used as fallback if the API route fails
 */
const legacyUploadToCloudinary = async (file: File, folder: string = 'uploads'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      if (!reader.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      try {
        // Extract base64 data
        const base64Data = reader.result.toString().split(',')[1];
        
        // Create a FormData object
        const formData = new FormData();
        formData.append('file', `data:${file.type};base64,${base64Data}`);
        formData.append('upload_preset', cloudinaryConfig.upload_preset);
        formData.append('folder', folder);
        
        // Try multiple approaches, starting with direct upload
        try {
          // 1. First try direct upload
          const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`;
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            mode: 'cors',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            resolve(uploadResult.secure_url);
            return;
          }
        } catch (directError) {
          console.log('Direct upload failed, trying alternative methods...', directError);
        }
        
        // 2. Try the direct file upload
        try {
          const fileUrl = await uploadDirectFile(file, folder);
          resolve(fileUrl);
          return;
        } catch (fileError) {
          console.log('Direct file upload failed, trying CORS proxy...', fileError);
        }
        
        // 3. Try CORS proxy (last resort)
        const proxyUrl = `${corsProxies[0]}https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`;
        const proxyResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: `data:${file.type};base64,${base64Data}`,
            upload_preset: cloudinaryConfig.upload_preset,
            folder: folder,
            api_key: cloudinaryConfig.api_key,
          }),
        });
        
        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.text();
          throw new Error(`All upload methods failed: ${errorData}`);
        }
        
        const proxyResult = await proxyResponse.json();
        resolve(proxyResult.secure_url);
      } catch (error) {
        console.error('All upload methods failed:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Alternative direct file upload method that works around CORS
 * by using a different approach (FormData with file blob)
 */
const uploadDirectFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
  try {
    // Create a FormData object with the direct file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.upload_preset);
    formData.append('folder', folder);
    formData.append('api_key', cloudinaryConfig.api_key);
    
    // Try to use image upload endpoint if it's an image
    const endpoint = file.type.startsWith('image/')
      ? 'image/upload'
      : file.type.startsWith('video/')
        ? 'video/upload'
        : 'auto/upload';
    
    // Upload directly
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/${endpoint}`,
      {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Direct upload failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Direct upload error:', error);
    throw error;
  }
}; 