// Run this script to check your S3 configuration
// Usage: node scripts/check-s3.js

const { S3Client, ListBucketsCommand, ListObjectsV2Command, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

// Get configuration from environment variables
const region = process.env.AWS_REGION || 'eu-central-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Configure S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function checkS3Configuration() {
  console.log('🔍 Checking S3 Configuration...\n');
  
  // Check if credentials are set
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials are not set in .env.local file');
    console.log('  Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local');
    return;
  }
  
  console.log('✅ AWS credentials found in environment variables');
  
  try {
    // Check if we can list buckets (basic permissions check)
    console.log('\n📋 Trying to list buckets...');
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
    console.log(`✅ Successfully listed ${listBucketsResponse.Buckets?.length || 0} buckets`);
    
    // Check if our bucket exists
    const bucketExists = listBucketsResponse.Buckets?.some(
      bucket => bucket.Name === bucketName
    );
    
    if (!bucketExists) {
      console.error(`❌ Bucket "${bucketName}" not found in your account`);
      console.log('  Available buckets:');
      listBucketsResponse.Buckets?.forEach(bucket => {
        console.log(`  - ${bucket.Name}`);
      });
      return;
    }
    
    console.log(`✅ Bucket "${bucketName}" exists in your account`);
    
    // Check if we can list objects in the bucket
    console.log('\n📋 Trying to list objects in bucket...');
    const listObjectsResponse = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 10 })
    );
    
    console.log(`✅ Successfully listed ${listObjectsResponse.Contents?.length || 0} objects in bucket`);
    
    if (listObjectsResponse.Contents?.length > 0) {
      console.log('  Sample objects:');
      listObjectsResponse.Contents.slice(0, 5).forEach(item => {
        console.log(`  - ${item.Key} (${formatBytes(item.Size)})`);
      });
    } else {
      console.log('  Bucket is empty');
    }
    
    // Check CORS configuration
    console.log('\n🌐 Checking CORS configuration...');
    try {
      const corsResponse = await s3Client.send(
        new GetBucketCorsCommand({ Bucket: bucketName })
      );
      
      if (corsResponse.CORSRules?.length > 0) {
        console.log('✅ CORS is configured:');
        corsResponse.CORSRules.forEach((rule, index) => {
          console.log(`  Rule ${index + 1}:`);
          console.log(`    AllowedOrigins: ${rule.AllowedOrigins?.join(', ') || 'none'}`);
          console.log(`    AllowedMethods: ${rule.AllowedMethods?.join(', ') || 'none'}`);
          console.log(`    AllowedHeaders: ${rule.AllowedHeaders?.join(', ') || 'none'}`);
        });
      } else {
        console.warn('⚠️ CORS rules exist but are empty');
      }
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.error('❌ No CORS configuration found on the bucket');
        console.log('  You need to set up CORS to allow browser access');
        console.log('  Run: aws s3api put-bucket-cors --bucket ' + bucketName + ' --cors-configuration file://s3-cors.json');
      } else {
        console.error('❌ Error checking CORS:', error.message);
      }
    }
    
    console.log('\n✨ S3 Configuration check completed');
    
  } catch (error) {
    console.error('❌ Error checking S3 configuration:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('\nYour AWS credentials are invalid or expired. Please check:');
      console.log('1. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local are correct');
      console.log('2. The IAM user has appropriate permissions for S3');
    } else if (error.name === 'AccessDenied') {
      console.log('\nAccess denied. Your IAM user does not have sufficient permissions:');
      console.log('1. Make sure the IAM user has the following permissions:');
      console.log('   - s3:ListAllMyBuckets');
      console.log('   - s3:GetBucketLocation');
      console.log('   - s3:ListBucket');
      console.log('   - s3:GetObject');
      console.log('   - s3:PutObject');
      console.log('2. Apply the policy in s3-permissions.json to your IAM user');
    }
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the check
checkS3Configuration(); 