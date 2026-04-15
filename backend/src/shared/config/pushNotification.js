const { Expo } = require('expo-server-sdk');
const prisma = require('./prisma');

let expo = new Expo();

/**
 * sendPushNotification
 * 
 * Sends a high-priority push notification to a user's mobile device.
 * Used for critical events like visitor entry requests.
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
      console.log(`[Push] No token found for user ${userId}`);
      return;
    }

    if (!Expo.isExpoPushToken(user.fcmToken)) {
      console.error(`[Push] Invalid expo push token: ${user.fcmToken}`);
      return;
    }

    const messages = [{
      to: user.fcmToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'visitor-alerts', // Matches mobile app channel
    }];

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('[Push] Send results:', ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('[Push] Error sending chunk:', error);
      }
    }

    // NOTE: In a production app, you should check tickets for errors
    // and handle token expiration/invalidation by removing it from the DB.
    console.log(`[Push] Sent notification to ${userId}: ${title}`);
    
  } catch (err) {
    console.error('[Push] Fatal error:', err);
  }
};

module.exports = { sendPushNotification };
