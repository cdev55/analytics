import mongoose from "mongoose";
import amqp from "amqplib";
import express from "express";
import cron from "node-cron";
import e from "express";
import { sendDataToDB } from "./services/sendDb.js";

const rabbitmqUrl = "amqp://rabbitmq";
const rabbitmqQueue = "analytics_queue";
const apiKey = "YOUR_API_KEY";
const mongoUrl = "mongodb://localhost:27017/analyticsdb"; // Replace with your MongoDB URL

let data = {};
let pageVisitData = {};
let platformVisitData = {};

async function processAnalytics() {
  let data = {};
  let pageVisitData = {};
  let platformVisitData = {};
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(rabbitmqQueue, { durable: true });

    console.log("Processing analytics events...");

   await channel.consume(
      rabbitmqQueue,
      (msg) => {
        if (msg) {
          const eventString = msg.content.toString();
          console.log({eventString})
          const event = JSON.parse(eventString);
          if (event.apiKey === apiKey) {
            try {
              if (event.eventType === "pg_visit") {
                const pageName = event?.properties?.title;
                if (pageVisitData[pageName]) {
                  pageVisitData[pageName].eventCount += 1;
                } else {
                  pageVisitData = {
                    ...pageVisitData,
                    [pageName]: { ...event, eventCount: 1 },
                  };
                }
              } else if (event.eventType === "plt_visit") {
                if (Object.keys(platformVisitData).length) {
                  platformVisitData.eventCount += 1;
                } else {
                  platformVisitData = { ...event, eventCount: 1 };
                }
              }
              channel.ack(msg); // Acknowledge msg to remove from queue
            } catch (dbError) {
              console.error("Database error:", dbError);
              channel.nack(msg, false, true); //Nack the msg to requeue it
            }
          } else {
            console.warn("Invalid API key in msg. Discarding.");
            channel.ack(msg);
          }
          // resolve(JSON.parse(msg.content.toString()));
        }
      },
      {
        noAck: false,
      }
    );

    data = { pageVisitData, platformVisitData };
    console.log("Collected data::>>", data);
    await sendDataToDB(data);
    // pageVisitData = {};
    // platformVisitData = {};
    // console.log("Collected data::>>", data);
    console.log("Analytics processing complete.");
  } catch (error) {
    console.error("Error processing analytics:", error);
  } finally {
    await mongoose.disconnect(); //Disconnect from Mongoose
    await channel.close();
    await connection.close();
  }
}

const app = express();

const port = 7000;

// Schedule the job to run daily at midnight
// cron.schedule('0 0 * * *', () => {
//   console.log('Running analytics processor...');
//   processAnalytics();
// }, {
//   scheduled: true,
//   timezone: 'UTC' // Set your desired timezone
// });

setInterval(() => {
  console.log("Running analytics processor...");
  // processAnalytics();
}, 10000);

console.log("Analytics processor scheduled to run daily.");

app.get("/events", (req, res) => {
  res.send({ message: "Eventss Processing" });
});

app.listen(port, () => {
  console.log(`Analytics processor listening on porter ${port}`);
});
