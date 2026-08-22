const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo();

/**
 * Gönderilecek mesajları alır ve Expo Push API üzerinden gönderir.
 * @param {Array<{pushToken: string, title: string, body: string, data: object}>} messages 
 */
async function sendPushNotifications(messages) {
  let expoMessages = [];

  for (let msg of messages) {
    if (!Expo.isExpoPushToken(msg.pushToken)) {
      console.error(`Push token ${msg.pushToken} is not a valid Expo push token`);
      continue;
    }

    expoMessages.push({
      to: msg.pushToken,
      sound: 'default',
      title: msg.title,
      body: msg.body,
      data: msg.data || {},
    });
  }

  let chunks = expo.chunkPushNotifications(expoMessages);
  let tickets = [];

  // Send the chunks to the Expo push notification service.
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push tickets:', ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push chunk:', error);
    }
  }

  return tickets;
}

module.exports = {
  sendPushNotifications
};
