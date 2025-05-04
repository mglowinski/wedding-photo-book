# Digital Guestbook for 30th Birthday Celebration

A web application that allows guests to upload photos, videos, and audio recordings for Joanna & Maciej's 30th birthday celebration.

## Features

- Simple, mobile-friendly interface
- Upload photos, videos, and audio recordings
- Protected gallery access
- Easy media browsing and downloading

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Firebase (Authentication, Storage, Firestore)
- **Hosting**: Can be deployed on Vercel, Netlify, or Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Firebase account

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

3. Create a Firebase project and configure it
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Storage, and Firestore
   - Get your Firebase configuration and update it in `src/lib/firebase.ts`

4. Run the development server
```
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### QR Code Generation

1. Deploy your application to your preferred hosting platform
2. Use a QR code generator to create a QR code that directs to your application's URL
3. Print the QR code and place it at your celebration venue

### Gallery Access

The gallery is protected with a password. The default password is `birthday2025`, which you can change in the `AuthForm.tsx` component.

## License

This project is licensed under the MIT License. 