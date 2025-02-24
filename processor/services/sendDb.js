import mongoose from "mongoose";
const mongoUrl = "mongodb://mongodb:27017/analyticsdb"; // Replace with your MongoDB URL

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log("Erro while connecting to mongodb::", error);
  }
};

const dailyEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true },
    appId: { type: String, required: true },
    apiKey: { type: String, required: true },
    userId: { type: String, required: true },
    ip: { type: String },
    city: { type: String },
    country: { type: String },
    userEmail: { type: String },
    userMobile: { type: String },
    loggedIn: { type: Boolean },
    url: { type: String },
    userAgent: { type: String },
    eventTime: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// {
//   "userId": "user-1j4c9v162",
//   "appId": "",
//   "loggedIn": false,
//   "userEmail": "",
//   "userMobile": "",
//   "ip": "183.83.152.79",
//   "location": "New Delhi-India",
//   "url": "http://localhost:3000",
//   "apiKey": "YOUR_API_KEY",
//   "eventType": "pg_visit",
//   "eventTime": "2025-02-21T10:19:39.866Z"
// }

dailyEventSchema.index({ eventType: 1, eventTime: 1 });

const DailyEvent =
  mongoose.models.DailyEvent || mongoose.model("DailyEvent", dailyEventSchema);

export const sendDataToDB = async (collectedData) => {
  await connectDB();
  try {
    let documents = collectedData;
    const options = { ordered: true };
    if (documents.length) {
      const result = await DailyEvent.insertMany(documents, options);
      console.log("Data inserted successfully :", result);
    } else {
      console.log("NO data to be inserted !! :");
    }
  } catch (error) {
    console.log("Error while inserting Data:", error);
  }
};
