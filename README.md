# Digital Guestbook for 30th Birthday Celebration

A web application that allows guests to upload photos, videos, and audio recordings for Joanna & Maciej's 30th birthday celebration.

## Features

- Simple, mobile-friendly interface
- Upload photos, videos, and audio recordings
- Protected gallery access
- Easy media browsing and downloading
- Multiple storage options (local or AWS S3)

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Storage Options**: 
  - Local file storage (default)
  - AWS S3 (for unlimited file sizes and better scaling)
- **Hosting**: Can be deployed on Vercel (recommended) or any Node.js host

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- (Optional) AWS account for S3 storage

### Installation

1. Clone this repository
```
git clone https://github.com/yourusername/wedding-photo-book.git
cd wedding-photo-book
```

2. Install dependencies
```
npm install
```

3. Run the development server
```
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Storage Configuration

The application supports two storage methods:

### Local Storage (Default)

- Files are stored directly on the server in the `public/uploads` directory
- Good for development and testing
- Limited by server disk space
- Not recommended for large videos or high-traffic sites

### AWS S3 Storage 

- Files are stored in Amazon S3 cloud storage
- No file size limits (up to 5TB per file)
- Better scalability and reliability
- Requires AWS account and configuration

#### Setting up AWS S3:

1. **Create an AWS Account**
   - Sign up at [aws.amazon.com](https://aws.amazon.com/)

2. **Create an S3 Bucket**
   - Go to S3 in AWS Console
   - Create a new bucket
   - Configure CORS to allow uploads from your domain:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Create an IAM User**
   - Go to IAM in AWS Console
   - Create a new policy with S3 access rights
   - Create a new user with programmatic access
   - Attach the policy to the user
   - Save the access key and secret key

4. **Configure Environment Variables**
   - Create a `.env.local` file in the project root
   - Add the following variables:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=bucket_region (e.g., eu-central-1)
   AWS_S3_BUCKET_NAME=your_bucket_name
   STORAGE_TYPE=s3
   ```

5. **Toggle Storage Type**
   - Visit the admin page at `/admin`
   - Use the storage toggle to switch between local and S3 storage

## Deployment

### Recommended Deployment: Vercel + S3

1. **Push your code to GitHub**

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy

3. **Configure S3 for Production**
   - Update CORS settings to only allow your Vercel domain
   - Set appropriate bucket policies

### QR Code Generation

1. Deploy your application to your preferred hosting platform
2. Use a QR code generator to create a QR code that directs to your application's URL
3. Print the QR code and place it at your celebration venue

### Gallery Access

The gallery is protected with a password. The default password is `birthday2025`, which you can change in the `AuthForm.tsx` component.

## License

This project is licensed under the MIT License. 