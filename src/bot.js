const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Bot configuration
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-referral-bot')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Bot constants
const YOUTUBE_CHANNEL_URL = process.env.YOUTUBE_CHANNEL_URL;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const REFERRAL_REWARD = parseInt(process.env.REFERRAL_REWARD) || 5;
const MIN_WITHDRAWAL = parseInt(process.env.MIN_WITHDRAWAL_AMOUNT) || 100;
const BOT_URL = process.env.BOT_URL;

// Generate unique referral code
function generateReferralCode(userId) {
  return crypto.createHash('md5').update(userId.toString()).digest('hex').substring(0, 8);
}

// Main menu keyboard
function getMainMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🔗 Get Referral Link' }, { text: '💰 Wallet' }],
        [{ text: '💳 Set UPI ID' }, { text: '❓ How to Use Bot' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// YouTube subscription check keyboard
function getYouTubeCheckKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📺 Subscribe to Channel', url: YOUTUBE_CHANNEL_URL }],
        [{ text: '✅ I have subscribed', callback_data: 'check_subscription' }]
      ]
    }
  };
}

// Check if user has subscribed to YouTube channel
async function checkYouTubeSubscription(userId) {
  // Since we can't directly verify YouTube subscription via Telegram API,
  // we'll use a simple verification method where user confirms subscription
  // In a real-world scenario, you might integrate with YouTube API
  return true; // For demo purposes, always return true after user clicks
}

// Handle /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const referralCode = match[1]; // Extract referral code from start parameter

  try {
    // Check if user already exists
    let user = await User.findOne({ telegramId: userId });
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId: userId,
        username: username,
        referralCode: generateReferralCode(userId),
        joinedAt: new Date(),
        isSubscribed: false
      });

      // Handle referral if present
      if (referralCode) {
        const referrer = await User.findOne({ referralCode: referralCode });
        if (referrer && referrer.telegramId !== userId) {
          user.referredBy = referrer.telegramId;
          // Credit referral reward to referrer after subscription verification
        }
      }

      await user.save();
    }

    // Check subscription status
    if (!user.isSubscribed) {
      const welcomeMessage = `🎉 Welcome to ReferLootBot!\n\n` +
        `To get started, please subscribe to our YouTube channel and verify your subscription.\n\n` +
        `📺 Channel: ${YOUTUBE_CHANNEL_ID}\n` +
        `💰 Earn ₹${REFERRAL_REWARD} for each successful referral!\n` +
        `💸 Minimum withdrawal: ₹${MIN_WITHDRAWAL}`;

      await bot.sendMessage(chatId, welcomeMessage, getYouTubeCheckKeyboard());
    } else {
      // User is already subscribed, show main menu
      const welcomeBackMessage = `🎉 Welcome back, ${username}!\n\n` +
        `💰 Your Balance: ₹${user.walletBalance}\n` +
        `👥 Total Referrals: ${user.referralCount}\n\n` +
        `Choose an option below:`;

      await bot.sendMessage(chatId, welcomeBackMessage, getMainMenuKeyboard());
    }

  } catch (error) {
    console.error('Error in /start command:', error);
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.');
  }
});

// Handle callback queries (subscription verification and withdrawal requests)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === 'check_subscription') {
    try {
      const user = await User.findOne({ telegramId: userId });
      
      if (!user) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'User not found. Please restart the bot.' });
        return;
      }

      // Mark user as subscribed
      user.isSubscribed = true;
      
      // Process referral reward if user was referred
      if (user.referredBy) {
        const referrer = await User.findOne({ telegramId: user.referredBy });
        if (referrer) {
          referrer.walletBalance += REFERRAL_REWARD;
          referrer.referralCount += 1;
          referrer.referredUsers.push(userId);
          await referrer.save();

          // Notify referrer
          await bot.sendMessage(user.referredBy, 
            `🎉 Congratulations! You earned ₹${REFERRAL_REWARD} from a successful referral!\n\n` +
            `💰 New Balance: ₹${referrer.walletBalance}\n` +
            `👥 Total Referrals: ${referrer.referralCount}`
          );
        }
      }

      await user.save();

      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Subscription verified!' });
      
      const successMessage = `✅ Subscription verified successfully!\n\n` +
        `🎉 Welcome to ReferLootBot!\n` +
        `💰 Your Balance: ₹${user.walletBalance}\n` +
        `👥 Total Referrals: ${user.referralCount}\n\n` +
        `Choose an option below:`;

      await bot.editMessageText(successMessage, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        ...getMainMenuKeyboard()
      });

    } catch (error) {
      console.error('Error in subscription verification:', error);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Verification failed. Please try again.' });
    }
  } else if (data === 'withdraw_money') {
    try {
      const user = await User.findOne({ telegramId: userId });
      
      if (!user) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'User not found.' });
        return;
      }

      if (user.walletBalance < MIN_WITHDRAWAL) {
        await bot.answerCallbackQuery(callbackQuery.id, 
          { text: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}` });
        return;
      }

      if (!user.upiId) {
        await bot.answerCallbackQuery(callbackQuery.id, 
          { text: 'Please set your UPI ID first.' });
        return;
      }

      // Check for pending withdrawal
      const pendingWithdrawal = await Withdrawal.findOne({ 
        userId: userId, 
        status: 'pending' 
      });

      if (pendingWithdrawal) {
        await bot.answerCallbackQuery(callbackQuery.id, 
          { text: 'You already have a pending withdrawal request.' });
        return;
      }

      // Create withdrawal request
      const withdrawal = new Withdrawal({
        userId: userId,
        username: user.username,
        amount: user.walletBalance,
        upiId: user.upiId,
        requestedAt: new Date(),
        status: 'pending'
      });

      await withdrawal.save();

      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Withdrawal request submitted!' });
      
      const withdrawalMessage = `💸 Withdrawal Request Submitted!\n\n` +
        `💰 Amount: ₹${user.walletBalance}\n` +
        `💳 UPI ID: ${user.upiId}\n` +
        `📅 Requested: ${new Date().toLocaleDateString()}\n\n` +
        `⏳ Your request is being processed. You will be notified once approved.\n\n` +
        `📞 For queries, contact @youbtech`;

      await bot.editMessageText(withdrawalMessage, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });

    } catch (error) {
      console.error('Error in withdrawal request:', error);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Withdrawal request failed.' });
    }
  }
});

// Handle main menu buttons
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Skip if it's a command
  if (text && text.startsWith('/')) return;

  try {
    const user = await User.findOne({ telegramId: userId });
    
    if (!user || !user.isSubscribed) {
      await bot.sendMessage(chatId, '❌ Please complete the subscription verification first.');
      return;
    }

    switch (text) {
      case '🔗 Get Referral Link':
        const referralLink = `${BOT_URL}?start=${user.referralCode}`;
        const referralMessage = `🔗 Your Referral Link:\n\n` +
          `${referralLink}\n\n` +
          `💰 Earn ₹${REFERRAL_REWARD} for each person who joins using your link!\n` +
          `👥 Current Referrals: ${user.referralCount}\n` +
          `💸 Total Earned: ₹${user.referralCount * REFERRAL_REWARD}\n\n` +
          `Share this link with your friends and start earning!`;
        
        await bot.sendMessage(chatId, referralMessage);
        break;

      case '💰 Wallet':
        const walletKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💸 Withdraw Money', callback_data: 'withdraw_money' }]
            ]
          }
        };

        const walletMessage = `💰 Your Wallet Details:\n\n` +
          `💵 Balance: ₹${user.walletBalance}\n` +
          `👥 Total Referrals: ${user.referralCount}\n` +
          `💰 Total Earned: ₹${user.referralCount * REFERRAL_REWARD}\n` +
          `💳 UPI ID: ${user.upiId || 'Not set'}\n\n` +
          `💸 Minimum withdrawal: ₹${MIN_WITHDRAWAL}`;

        await bot.sendMessage(chatId, walletMessage, walletKeyboard);
        break;

      case '💳 Set UPI ID':
        await bot.sendMessage(chatId, 
          `💳 Please enter your UPI ID:\n\n` +
          `Example: yourname@paytm, yourname@phonepe, yourname@gpay\n\n` +
          `⚠️ Make sure your UPI ID is correct as payments will be sent to this ID.`
        );
        
        // Set user state to expect UPI ID
        user.awaitingUpiId = true;
        await user.save();
        break;

      case '❓ How to Use Bot':
        const helpMessage = `❓ How to Use ReferLootBot:\n\n` +
          `1️⃣ Get your referral link from the menu\n` +
          `2️⃣ Share it with friends and family\n` +
          `3️⃣ Earn ₹${REFERRAL_REWARD} for each person who joins\n` +
          `4️⃣ Set your UPI ID for withdrawals\n` +
          `5️⃣ Withdraw when you reach ₹${MIN_WITHDRAWAL}\n\n` +
          `💡 Tips:\n` +
          `• Share on WhatsApp, Facebook, Instagram\n` +
          `• Tell friends about the earning opportunity\n` +
          `• The more you share, the more you earn!\n\n` +
          `📞 Support: Contact @youbtech for help`;

        await bot.sendMessage(chatId, helpMessage);
        break;

      default:
        // Check if user is setting UPI ID
        if (user.awaitingUpiId) {
          const upiId = text.trim();
          
          // Basic UPI ID validation
          if (upiId.includes('@') && upiId.length > 5) {
            user.upiId = upiId;
            user.awaitingUpiId = false;
            await user.save();

            await bot.sendMessage(chatId, 
              `✅ UPI ID set successfully!\n\n` +
              `💳 Your UPI ID: ${upiId}\n\n` +
              `You can now withdraw money when your balance reaches ₹${MIN_WITHDRAWAL}.`
            );
          } else {
            await bot.sendMessage(chatId, 
              `❌ Invalid UPI ID format.\n\n` +
              `Please enter a valid UPI ID like: yourname@paytm`
            );
          }
        }
        break;
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.');
  }
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot started successfully!');

module.exports = bot;

