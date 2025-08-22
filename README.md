# CodeMarket - Source Code E-commerce Website

A modern, fast, animated, and professional-looking source-code selling e-commerce website built with pure HTML, CSS, and JavaScript.

## 🚀 Features

- **Modern UI/UX**: Beautiful gradient backgrounds, smooth animations, and responsive design
- **Firebase Integration**: Real-time database with Firestore for product management
- **Admin Panel**: Secure admin authentication and product management interface
- **Razorpay Payment**: Integrated payment gateway with test credentials
- **Instant Downloads**: Secure download links after successful payment
- **Legal Compliance**: Complete Terms of Service and Privacy Policy pages
- **Vercel Ready**: Configured for easy deployment on Vercel

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payment**: Razorpay Payment Gateway
- **Hosting**: Vercel (configured)
- **Fonts**: Google Fonts (Inter)

## 📁 Project Structure

```
source-code-ecommerce/
├── index.html          # Homepage with product grid
├── product.html        # Individual product details page
├── admin.html          # Admin panel for product management
├── download.html       # Secure download page post-payment
├── terms.html          # Terms of Service page
├── privacy.html        # Privacy Policy page
├── vercel.json         # Vercel deployment configuration
├── css/
│   └── style.css       # Main stylesheet with modern styling
├── js/
│   └── firebase-config.js  # Firebase configuration and utilities
└── README.md           # This file
```

## 🔧 Setup Instructions

### 1. Firebase Configuration

The website is pre-configured with Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAg6E4_J6q9n0kFWwMo_uq1G8nJlsmDSDA",
  authDomain: "turnament-c183f.firebaseapp.com",
  databaseURL: "https://turnament-c183f-default-rtdb.firebaseio.com",
  projectId: "turnament-c183f",
  storageBucket: "turnament-c183f.firebasestorage.app",
  messagingSenderId: "523966497566",
  appId: "1:523966497566:web:72f37516ecd277da4cff0f",
  measurementId: "G-EPP0V8N8L4"
};
```

### 2. Admin Account Setup

To access the admin panel, you'll need to create a user in Firebase Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project: `turnament-c183f`
3. Navigate to Authentication > Users
4. Add a new user with email and password
5. Use these credentials to log into `/admin`

### 3. Razorpay Configuration

The website uses Razorpay test credentials:

- **Key ID**: `rzp_test_lkoFfNbWaRVyLf`
- **Key Secret**: `CZeKvVHB8NClelJCTMDD2cc4`

For production, replace with your live Razorpay credentials.

### 4. Local Development

1. Clone or download the project files
2. Start a local HTTP server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser

## 🚀 Deployment on Vercel

### Method 1: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd source-code-ecommerce
   vercel
   ```

### Method 2: GitHub Integration

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically

### Method 3: Drag & Drop

1. Zip the `source-code-ecommerce` folder
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Drag and drop the zip file

## 📋 Admin Panel Usage

### Accessing Admin Panel

1. Navigate to `/admin`
2. Login with Firebase Auth credentials
3. Manage products from the dashboard

### Adding Products

1. Click "Add New Product"
2. Fill in product details:
   - **Title**: Product name
   - **Description**: Detailed description
   - **Price**: Price in INR
   - **Image URL**: External image link (Google Drive, Imgur, etc.)
   - **Download URL**: External download link (Google Drive, Dropbox, etc.)
3. Save the product

### Managing Products

- **Edit**: Click edit button to modify product details
- **Delete**: Click delete button to remove products
- **View**: All products are listed in a table format

## 💳 Payment Flow

1. User browses products on homepage
2. Clicks "View Details" to see product page
3. Clicks "Buy Now" to initiate payment
4. Razorpay payment modal opens
5. After successful payment, user is redirected to download page
6. Download link is provided securely

## 🔒 Security Features

- Firebase Authentication for admin access
- Secure payment processing via Razorpay
- Download page access verification
- External links for images and downloads (no file uploads)
- Input validation and sanitization

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🎨 Customization

### Colors and Styling

Edit `css/style.css` to customize:
- Color schemes
- Fonts and typography
- Layout and spacing
- Animations and effects

### Firebase Configuration

To use your own Firebase project:
1. Create a new Firebase project
2. Enable Firestore and Authentication
3. Replace the configuration in `js/firebase-config.js`

### Payment Gateway

To use live Razorpay credentials:
1. Get live keys from Razorpay dashboard
2. Replace test keys in `product.html`
3. Update webhook configurations if needed

## 📄 Legal Pages

The website includes comprehensive legal pages:

- **Terms of Service** (`/terms`): Complete terms and conditions
- **Privacy Policy** (`/privacy`): GDPR-compliant privacy policy

These pages are essential for:
- Razorpay approval
- Legal compliance
- User trust and transparency

## 🐛 Troubleshooting

### Common Issues

1. **Products not loading**: Check Firebase configuration and internet connection
2. **Admin login fails**: Verify Firebase Authentication setup
3. **Payment not working**: Ensure Razorpay keys are correct
4. **Styling issues**: Clear browser cache and check CSS file path

### Browser Console

Check browser console for JavaScript errors and Firebase connection issues.

## 📞 Support

For technical support or questions:
- Check browser console for errors
- Verify Firebase and Razorpay configurations
- Ensure all file paths are correct
- Test with different browsers

## 📝 License

This project is provided as-is for educational and commercial use. Modify and customize according to your needs.

## 🎯 Production Checklist

Before going live:

- [ ] Set up your own Firebase project
- [ ] Configure live Razorpay credentials
- [ ] Update contact information in legal pages
- [ ] Test all functionality thoroughly
- [ ] Set up proper domain and SSL
- [ ] Configure Firebase security rules
- [ ] Set up monitoring and analytics

---

**Built with ❤️ for modern e-commerce needs**

