# Telegram Referral Bot System (ReferLootBot)

A complete Telegram referral bot system with Node.js backend, MongoDB database, and HTML+TailwindCSS admin panel, fully optimized for Render.com deployment.

## 🚀 Features

- **Telegram Bot (@Referneww_bot)**
  - YouTube channel subscription verification
  - Referral link generation and tracking
  - Wallet management with ₹5 per referral
  - UPI ID setup for withdrawals
  - Minimum withdrawal amount: ₹100
  - User-friendly interface with inline keyboards

- **Admin Panel**
  - Secure admin authentication
  - User management and analytics
  - Withdrawal request approval system
  - Real-time statistics dashboard
  - Export functionality for user data
  - Responsive design with TailwindCSS

- **Backend Features**
  - Express.js REST API
  - MongoDB with Mongoose ODM
  - JSON file storage fallback
  - JWT-based authentication
  - CORS enabled for cross-origin requests
  - Error handling and logging

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with JSON fallback)
- **Bot Framework**: node-telegram-bot-api
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Authentication**: JWT, bcryptjs
- **Deployment**: Render.com ready

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (optional - JSON fallback available)
- Telegram Bot Token

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-referral-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Telegram Bot Configuration
   BOT_TOKEN=your_bot_token_here
   BOT_USERNAME=your_bot_username
   
   # YouTube Channel Configuration
   YOUTUBE_CHANNEL_URL=https://youtube.com/@error_amn?si=BJ8yvX6cedErf8QZ
   YOUTUBE_CHANNEL_ID=@error_amn
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/telegram-referral-bot
   
   # Admin Panel Configuration
   ADMIN_USERNAME=youbtech
   ADMIN_PASSWORD=youbtech
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-super-secret-session-key
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Referral Configuration
   REFERRAL_REWARD=5
   MIN_WITHDRAWAL_AMOUNT=100
   
   # Bot Configuration
   BOT_URL=https://t.me/your_bot_username
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Bot: Start your Telegram bot
   - Admin Panel: http://localhost:3000/admin
   - API Health: http://localhost:3000/health

## 🚀 Render.com Deployment

### Automatic Deployment

1. **Connect Repository**
   - Fork this repository to your GitHub account
   - Connect your GitHub account to Render.com
   - Create a new Web Service from your repository

2. **Environment Variables**
   Set the following environment variables in Render dashboard:
   ```
   BOT_TOKEN=your_bot_token_here
   MONGODB_URI=your_mongodb_connection_string
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret_key
   NODE_ENV=production
   ```

3. **Deploy**
   - Render will automatically build and deploy your application
   - The `render.yaml` file contains all deployment configuration

### Manual Deployment

1. **Prepare for deployment**
   ```bash
   # Ensure all dependencies are installed
   npm install --production
   
   # Test the application
   npm start
   ```

2. **Deploy to Render**
   - Upload your code to a Git repository
   - Create a new Web Service on Render
   - Set environment variables
   - Deploy

## 📱 Bot Commands

- `/start` - Start the bot and begin verification
- `/start <referral_code>` - Start with referral code

## 🎛️ Admin Panel

### Login Credentials
- **Username**: youbtech (configurable via environment)
- **Password**: youbtech (configurable via environment)

### Features
- **Overview**: Dashboard with key statistics
- **Users**: User management and balance adjustment
- **Withdrawals**: Approval/rejection of withdrawal requests
- **Analytics**: Charts and growth metrics

## 🔧 API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics

### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get specific user
- `PUT /api/admin/users/:userId/balance` - Update user balance
- `PUT /api/admin/users/:userId/status` - Update user status

### Withdrawal Management
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PUT /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `PUT /api/admin/withdrawals/:id/reject` - Reject withdrawal
- `PUT /api/admin/withdrawals/:id/complete` - Complete withdrawal

## 🗄️ Database Schema

### User Model
```javascript
{
  telegramId: Number,
  username: String,
  referralCode: String,
  referredBy: Number,
  referredUsers: [Number],
  referralCount: Number,
  walletBalance: Number,
  totalEarned: Number,
  upiId: String,
  isSubscribed: Boolean,
  isActive: Boolean,
  joinedAt: Date
}
```

### Withdrawal Model
```javascript
{
  userId: Number,
  username: String,
  amount: Number,
  upiId: String,
  status: String, // pending, approved, rejected, completed
  requestedAt: Date,
  processedAt: Date,
  processedBy: String,
  adminNotes: String,
  transactionId: String
}
```

## 🔒 Security Features

- JWT-based admin authentication
- Environment variable configuration
- Input validation and sanitization
- CORS protection
- Rate limiting (can be added)
- Secure session management

## 📊 Monitoring

- Health check endpoint: `/health`
- Application logs for debugging
- Error handling and reporting
- Real-time statistics tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Telegram: @youbtech
- Email: support@youbtech.com

## 🔄 Updates

### Version 1.0.0
- Initial release
- Basic referral system
- Admin panel
- Render.com deployment ready

---

**Powered by You B Tech** 🚀

