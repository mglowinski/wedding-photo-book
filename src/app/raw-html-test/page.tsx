'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cloudinaryConfig } from '@/lib/cloudinary';

export default function RawHtmlTest() {
  const [htmlContent, setHtmlContent] = useState('');
  
  useEffect(() => {
    // Create the raw HTML content dynamically
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Raw Cloudinary Upload Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    button { padding: 10px 15px; background: #0070f3; color: white; border: none; cursor: pointer; }
    button:disabled { background: #ccc; }
    .error { color: red; margin: 10px 0; }
    .success { color: green; margin: 10px 0; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Raw Cloudinary Upload Test</h1>
  <p>This is a completely standalone HTML file testing direct uploads to Cloudinary.</p>
  
  <div class="form-group">
    <p><strong>Cloud Name:</strong> ${cloudinaryConfig.cloud_name}</p>
    <p><strong>Upload Preset:</strong> ${cloudinaryConfig.upload_preset}</p>
  </div>
  
  <div class="form-group">
    <label for="file">Select a file:</label>
    <input type="file" id="file" />
  </div>
  
  <button id="uploadBtn">Upload File</button>
  
  <div id="status"></div>
  <div id="result"></div>
  
  <script>
    document.getElementById('uploadBtn').addEventListener('click', async function() {
      const fileInput = document.getElementById('file');
      const statusDiv = document.getElementById('status');
      const resultDiv = document.getElementById('result');
      
      if (!fileInput.files || !fileInput.files[0]) {
        statusDiv.innerHTML = '<p class="error">Please select a file</p>';
        return;
      }
      
      const file = fileInput.files[0];
      statusDiv.innerHTML = '<p>Uploading...</p>';
      this.disabled = true;
      
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', '${cloudinaryConfig.upload_preset}');
        formData.append('folder', 'test');
        
        // Make direct upload request
        const response = await fetch('https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/upload', {
          method: 'POST',
          body: formData
        });
        
        // Handle response
        if (!response.ok) {
          let errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            errorText = JSON.stringify(errorJson, null, 2);
          } catch (e) {
            // keep as text
          }
          throw new Error(\`Upload failed: \${response.status} \${errorText}\`);
        }
        
        const result = await response.json();
        
        // Display success
        statusDiv.innerHTML = '<p class="success">Upload successful!</p>';
        
        // Display image if it's an image
        if (result.resource_type === 'image') {
          resultDiv.innerHTML = \`
            <p><strong>Image URL:</strong> <a href="\${result.secure_url}" target="_blank">\${result.secure_url}</a></p>
            <img src="\${result.secure_url}" alt="Uploaded image" />
          \`;
        } else {
          resultDiv.innerHTML = \`
            <p><strong>File URL:</strong> <a href="\${result.secure_url}" target="_blank">\${result.secure_url}</a></p>
          \`;
        }
      } catch (error) {
        statusDiv.innerHTML = \`<p class="error">\${error.message}</p>\`;
      } finally {
        this.disabled = false;
      }
    });
  </script>
</body>
</html>
    `;
    
    setHtmlContent(html);
  }, []);
  
  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudinary-test.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-black text-center mb-6">Raw HTML Upload Test</h2>
            
            <div className="p-4 mb-6 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                This page generates a standalone HTML file that you can download and open directly in your browser.
                It will test uploads to Cloudinary without any server-side code or Next.js - just pure HTML and JavaScript.
              </p>
              
              <p className="mt-2 text-blue-800">
                <strong>Important:</strong> This approach can help determine if the issue is with Cloudinary configuration 
                or with our server implementation.
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={handleDownloadHtml}
                className="btn btn-primary px-6 py-3"
              >
                Download HTML Test File
              </button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-black mb-4">HTML File Contents:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-96">
                {htmlContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 