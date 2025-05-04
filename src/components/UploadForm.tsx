'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { FiUpload, FiImage, FiVideo, FiMic, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

type MediaType = 'photo' | 'video' | 'audio';

export default function UploadForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MediaType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];

  const getAllowedTypes = () => {
    switch (activeTab) {
      case 'photo':
        return allowedPhotoTypes;
      case 'video':
        return allowedVideoTypes;
      case 'audio':
        return allowedAudioTypes;
      default:
        return [];
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = getAllowedTypes();
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError(`Invalid file type. Please upload a valid ${activeTab} file.`);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Create a unique file name
      const fileExtension = file.name.split('.').pop();
      const fileName = `${activeTab}_${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `uploads/${fileName}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          setError('Error uploading file: ' + error.message);
          setUploading(false);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save to Firestore
          await addDoc(collection(db, 'media'), {
            name,
            message,
            fileURL: downloadURL,
            fileName,
            fileType: activeTab,
            mimeType: file.type,
            createdAt: serverTimestamp(),
          });
          
          setSuccess(true);
          setUploading(false);
          
          // Reset form after 2 seconds
          setTimeout(() => {
            setFile(null);
            setName('');
            setMessage('');
            setUploadProgress(0);
            setSuccess(false);
            router.push('/');
          }, 2000);
        }
      );
    } catch (err) {
      setError('Error: ' + (err as Error).message);
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'photo'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiImage className="mr-2" /> Photos
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'video'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiVideo className="mr-2" /> Videos
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'audio'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiMic className="mr-2" /> Audio
        </button>
      </div>

      {success ? (
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <FiCheck className="mx-auto text-green-500 text-4xl mb-3" />
          <h3 className="text-xl font-semibold text-green-800">Upload Successful!</h3>
          <p className="text-green-600 mt-2">Thank you for your contribution.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-black font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-black font-medium mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message or wish"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">
              Upload {activeTab === 'photo' ? 'Photo' : activeTab === 'video' ? 'Video' : 'Audio'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                accept={getAllowedTypes().join(',')}
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {file ? (
                  <>
                    <FiCheck className="text-3xl text-green-500 mb-2" />
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-green-600 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <FiUpload className="text-3xl text-gray-400 mb-2" />
                    <p className="font-medium text-black">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-black mt-1">
                      {activeTab === 'photo'
                        ? 'JPG, PNG, GIF, WEBP'
                        : activeTab === 'video'
                        ? 'MP4, WEBM, MOV'
                        : 'MP3, WAV, OGG'}
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
              <FiAlertCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {uploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-black mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 btn ${
              uploading ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
            }`}
          >
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
} 