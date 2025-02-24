import mongoose from "mongoose";
import amqp from "amqplib";
import express from "express";
import cron from "node-cron";
import { sendDataToDB } from "./services/sendDb.js";
import { SQS } from "./sqs.js";
import dotenv from "dotenv";

const rabbitmqUrl = "amqp://rabbitmq";
const rabbitmqQueue = "analytics_queue";
const apiKey = "YOUR_API_KEY";
const mongoUrl = "mongodb://localhost:27017/analyticsdb"; // Replace with your MongoDB URL

let data = {};
let pageVisitData = {};
let platformVisitData = {};
dotenv.config();

const sqs = new SQS("analytics-dev");

const getMessage = async () => {
  const queue = await sqs.readMessages();
  if (!queue) return null;
  const message = queue;
  return message;
};

async function processAnalytics() {
  try {
    console.log("Processing analytics events...");
    const events = await getMessage();
    console.log("evnet:>>", events.length);
    sendDataToDB(events)
  } catch (error) {
    console.error("Error processing analytics:", error);
  } finally {
    // await mongoose.disconnect(); //Disconnect from Mongoose
    // await channel.close();
    // await connection.close();
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
  processAnalytics();
}, 10000);

console.log("Analytics processor scheduled to run daily.");

app.get("/events", (req, res) => {
  res.send({ message: "Eventss Processing" });
});

app.listen(port, () => {
  console.log(`Analytics processor listening on porter ${port}`);
});
