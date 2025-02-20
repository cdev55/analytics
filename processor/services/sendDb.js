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

const dailyEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  appId: { type: String, required: true },
  apiKey: { type: String, required: true },
  userId: { type: String, required: true },
  url: { type: String },
  userAgent: { type: String },
  eventTime: { type: Date, default: null },
  eventCount: { type: Number, default: 0 },
  properties: {},
});

dailyEventSchema.index({ eventType: 1, eventTime: 1 });

const DailyEvent =
  mongoose.models.DailyEvent || mongoose.model("DailyEvent", dailyEventSchema);

export const sendDataToDB = async (collectedData) => {
  await connectDB();
  try {
    console.log({ dataTosend: collectedData });
    let documents = [];
    if (
      collectedData?.pageVisitData &&
      Object.keys(collectedData?.pageVisitData).length > 0
    ) {
      documents.push(...Object.values(collectedData?.pageVisitData));
    }

    if (
      collectedData?.platformVisitData &&
      Object.keys(collectedData?.platformVisitData).length > 0
    ) {
      documents.push(collectedData?.platformVisitData);
    }
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
