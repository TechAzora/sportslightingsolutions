const awsIot = require("aws-iot-device-sdk");

const device = awsIot.device({
  keyPath: path.resolve(__dirname, process.env.MQTT_KEY_PATH),
  certPath: path.resolve(__dirname, process.env.MQTT_CERT_PATH),
  caPath: path.resolve(__dirname, process.env.MQTT_CA_PATH),
  clientId: process.env.MQTT_CLIENT_ID,
  host: process.env.MQTT_HOST,
});

const subscribedTopics = new Set();

// **Publish message function**
const publishToMQTT = (topic, message) => {
  return new Promise((resolve, reject) => {
    if (!topic || !message)
      return reject(new Error("Topic and message are required"));

    device.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        console.error("MQTT Publish Error:", err);
        return reject(new Error("Failed to publish message"));
      }
      console.log(`Message published to topic: ${topic}`);
      resolve();
    });
  });
};

// **Subscribe & handle messages function**
const subscribeToMQTT = (topic, callback) => {
  if (!topic) throw new Error("Topic is required");

  if (!subscribedTopics.has(topic)) {
    device.subscribe(topic, (err) => {
      if (err) {
        console.error("MQTT Subscription Error:", err);
        throw new Error("Failed to subscribe to topic");
      }
      console.log(`Subscribed to topic: ${topic}`);
      subscribedTopics.add(topic);
    });
  }

  device.on("message", (receivedTopic, payload) => {
    if (receivedTopic === topic) {
      try {
        const parsed = JSON.parse(payload);
        console.log(
          `Received message on topic "${receivedTopic}":`,
          payload.toString()
        );
        callback(parsed);
      } catch (err) {
        console.error("Failed to parse MQTT message:", err);
      }
    }
  });
};

module.exports = { publishToMQTT, subscribeToMQTT };
