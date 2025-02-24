import express from "express";
import amqp from "amqplib";
import dotenv from "dotenv";

import cors from "cors";
import { SQS } from "./sqs.js";
const app = express();

const port = 5000;

// app.use(express.json()); // Parse JSON request bodies
app.use(express.text({ type: "text/plain" }));
dotenv.config();
app.use(cors());
// app.use(
//   cors({
//     origin: "http://localhost:3000", // Allow only your frontend origin
//     methods: ["POST"], // Restrict to only necessary methods
//     allowedHeaders: ["Content-Type"], // Allow necessary headers
//     credentials: true, // Allow cookies and credentials
//   })
// );

// connectToRabbitMQ();

const apiKey = "YOUR_API_KEY"; // Replace with your actual API key

const sqs = new SQS("analytics-dev");

app.post("/events", async (req, res) => {
  const event = req.body;

  // Basic API key Authentication
  // if (events.length > 0 && events[0].apiKey !== apiKey) {
  //   console.warn("Invalid API key");
  //   return res.status(401).send("Invalid API key");
  // }
  console.log({ event });
  // console.log({parsed:JSON.parse(event)})
  try {
    // const channel = connectToRabbitMQ();
    await sqs.sendMessage(event);

    // const connection = await amqp.connect("amqp://localhost"); // Replace with your RabbitMQ URL
    // let rabbitmqChannel = await connection.createChannel();
    // const queue = "analytics_queue"; // Name of the queue
    // await rabbitmqChannel.assertQueue(queue, { durable: true });
    // // connectToRabbitMQ()
    // rabbitmqChannel.sendToQueue(
    //   "analytics_queue",
    //   Buffer.from(JSON.stringify(event)),
    //   {
    //     persistent: true, // Messages survive RabbitMQ restarts
    //   }
    // );
    console.log(`Published event(s) to SQS`);
    res.status(202).send("Events accepted for processing");
  } catch (error) {
    console.error("Error publishing to SQS:", error);
    res.status(500).send("Error publishing events");
  }
});

app.listen(port, () => {
  console.log(`Analytics Gateway listening on porter ${port}`);
});

//////////////
// app.post("/events", async (req, res) => {
//   if (req.body && Array.isArray(req.body)) {
//     const events = req.body;

//     // Basic API key Authentication
//     if (events.length > 0 && events[0].apiKey !== apiKey) {
//       console.warn("Invalid API key");
//       return res.status(401).send("Invalid API key");
//     }

//     try {
//       // const channel = connectToRabbitMQ();
//       const connection = await amqp.connect("amqp://rabbitmq"); // Replace with your RabbitMQ URL
//       let rabbitmqChannel = await connection.createChannel();
//       const queue = "analytics_queue"; // Name of the queue
//       await rabbitmqChannel.assertQueue(queue, { durable: true });
//       // connectToRabbitMQ()
//       events.forEach((event) => {
//         rabbitmqChannel.sendToQueue(
//           "analytics_queue",
//           Buffer.from(JSON.stringify(event)),
//           {
//             persistent: true, // Messages survive RabbitMQ restarts
//           }
//         );
//       });
//       console.log(`Published ${events.length} event(s) to RabbitMQ`);
//       res.status(202).send("Events accepted for processing");
//     } catch (error) {
//       console.error("Error publishing to RabbitMQ:", error);
//       res.status(500).send("Error publishing events");
//     }
//   } else {
//     res
//       .status(400)
//       .send("Invalid request body.  Must be a JSON array of events.");
//   }
// });
