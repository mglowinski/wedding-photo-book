# Wedding Photo Book 📸

A web application that allows wedding guests to upload and view photos from the celebration. Features a beautiful, responsive gallery with image preview functionality.

## Features

- 📱 Responsive, mobile-first interface
- 🖼️ Modern image gallery with preview modal
- 📤 Easy photo upload functionality
- 🔒 Protected gallery access
- ☁️ AWS S3 storage integration
- 🚀 Fast and reliable Vercel deployment

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Storage**: AWS S3
- **Hosting**: Vercel
- **Styling**: TailwindCSS with custom components

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- AWS account for S3 storage
- Vercel account for deployment

### Local Development

1. Clone this repository
```bash
git clone https://github.com/yourusername/wedding-photo-book.git
cd wedding-photo-book
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` with your AWS credentials and other configuration.

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment Guide

### Step 1: AWS S3 Setup

1. Create an AWS Account at [aws.amazon.com](https://aws.amazon.com/)

2. Create an S3 Bucket:
   - Go to S3 in AWS Console
   - Click "Create bucket"
   - Choose a unique bucket name
   - Select your preferred region
   - Uncheck "Block all public access" (we'll secure it with proper policies)
   - Enable ACLs
   - Click "Create bucket"

3. Configure CORS for your bucket:
   - Select your bucket
   - Go to "Permissions" tab
   - Find "Cross-origin resource sharing (CORS)"
   - Add the following configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

4. Create an IAM User:
   - Go to IAM in AWS Console
   - Create a new policy with the following JSON:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```
   - Create a new user with programmatic access
   - Attach the created policy
   - Save the Access Key ID and Secret Access Key

### Step 2: Vercel Deployment

1. Push your code to GitHub

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Create new project
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. Configure Environment Variables in Vercel:
   - Add the following variables:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_bucket_region
   AWS_S3_BUCKET_NAME=your_bucket_name
   NEXT_PUBLIC_GALLERY_PASSWORD=your_gallery_password
   ```

4. Deploy:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app is now live! 🎉

### Step 3: Post-Deployment

1. Update S3 CORS:
   - Replace `http://localhost:3000` with your Vercel domain
   - Add any additional domains if needed

2. Test the application:
   - Try uploading images
   - Check gallery access
   - Verify image preview functionality
   - Test on mobile devices

## Maintenance

### Updating the Gallery Password

The gallery password can be changed by updating the `NEXT_PUBLIC_GALLERY_PASSWORD` environment variable in your Vercel project settings.

### Monitoring S3 Usage

Monitor your S3 usage through AWS Console to manage costs:
- Go to S3 in AWS Console
- Select your bucket
- Check "Metrics" tab
- Set up billing alerts if needed

## Troubleshooting

### Common Issues

1. **Upload Errors**
   - Verify S3 credentials
   - Check CORS configuration
   - Ensure proper bucket permissions

2. **Image Preview Issues**
   - Clear browser cache
   - Check browser console for errors
   - Verify image URLs

3. **Mobile Responsiveness**
   - Test on various devices
   - Check viewport settings
   - Verify CSS breakpoints

## License

This project is licensed under the MIT License. 