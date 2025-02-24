import AWS from "aws-sdk";

export class SQS {
  /* SQS Config */
  accountId = "891377295425";
  region = `ap-south-1`;

  /* SQS Client */
  sqs;

  /**
   * @description this class helps to handle all events of SQS
   */
  constructor(sqsName = new Error(`SQS name is required`)) {
    this.queueName = sqsName;
    this.queueUrl = `https://sqs.${this.region}.amazonaws.com/${this.accountId}/${this.queueName}`;
    this.sqs = this.sqsClient();
    console.log(`loading sqs for ${this.queueUrl}`);
  }

  /**
   * @description this is main sqs client, which helps to connect aws sqs
   * @returns SQS client instance
   */
  sqsClient = () => {
    /* loading aws creds and configrations */
    AWS.config.update({
      region: this.region,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      signatureVersion: "v4",
    });

    /* Create SQS service client */
    return new AWS.SQS({ apiVersion: "2012-11-05" });
  };

  /**
   * @description - Setup the sendMessage parameter object
   * @param {object} messageObject - pass the object which you want to queue
   * @returns {object}
   */
  sendMessage = (messageObject, delaySeconds = null) => {
    console.log(`adding to SQS to ${this.queueUrl} - `, messageObject);
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          MessageBody: JSON.stringify({
            message: { ...messageObject },
            date: new Date().toISOString(),
            scope: this.queueName,
          }),
          QueueUrl: this.queueUrl,
        };

        this.sqs.sendMessage(
          delaySeconds
            ? { ...params, DelaySeconds: delaySeconds }
            : { ...params },
          (err, data) => {
            if (err) {
              console.log(
                `something went wrong, while writing SQS ERROR: ${err}`
              );
              return reject(err);
            }
            if (!err && data) {
              console.log("Successfully added message", data.MessageId);
              return resolve(data);
            }
          }
        );
      } catch (error) {
        console.log(
          `something went wrong while writing SQS! - ERROR: ${error.message}`
        );
        return reject(error);
      }
    });
  };

  /**
   * @description - this function helps to read SQS message
   * @returns sqs stored data
   */
  readMessages = async () => {
    const allMessages = [];
    const batchSize = 10;

    while (true) {
      try {
        const params = {
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: batchSize,
          VisibilityTimeout: 1800, // 30 mins visibility timeout
          WaitTimeSeconds: 0,
        };

        const data = await new Promise((resolve, reject) => {
          this.sqs.receiveMessage(params, (error, data) => {
            if (error) {
              console.log(`Error while reading messages:`, error);
              return reject(error);
            }
            resolve(data);
          });
        });

        if (!data.Messages || data.Messages.length === 0) {
          console.log("No more messages in SQS");
          break; // Exit loop when no messages are left
        }

        // Process each message and store it in the array
        data.Messages.forEach((msg) => {
          const event = JSON.parse(
            Object.values(JSON.parse(msg.Body).message).join("")
          );
          // console.log({
          //   56565: JSON.parse(Object.values(JSON.parse(msg.Body).message).join("")),
          // });
          allMessages.push({
            ...event
          });
        });
      } catch (error) {
        console.log(`Error while fetching messages: ${error.message}`);
        break;
      }
    }
    console.log("All Msgs::>>", allMessages);
    return allMessages;
  };

  // readMessage = () => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const params = {
  //         QueueUrl: this.queueUrl,
  //         MaxNumberOfMessages: 1,
  //         VisibilityTimeout: 1800, // 30 mins wait time for anyone else to process.
  //         WaitTimeSeconds: 0
  //       };
  //       this.sqs.receiveMessage(params, (error, data) => {
  //         if (error) {
  //           console.log(`something went while reading message: SQSClient`, error)
  //           return reject(error)
  //         } else {
  //           if (!data.Messages?.length) {
  //             console.log('Nothing to process in SQS');
  //             return resolve(null);
  //           }
  //           const body = JSON.parse(data?.Messages?.[0]?.Body)
  //           const queueId = data?.Messages[0]?.ReceiptHandle
  //           // console.log('SQS message received', { message: { ...body }, queueId });
  //           return resolve({ ...body, queueId })
  //         }
  //       });
  //     } catch (error) {
  //       console.log(`something went wrong while getting message! - ${error.message}`)
  //       return reject(error)
  //     }
  //   })
  // }

  /**
   * @description - this function helps to delete sqs message
   * @param {string} queueId - sqs message  ReceiptHandle id
   * @returns
   */
  deleteMessage = (queueId) => {
    return new Promise(async (resolve, reject) => {
      try {
        /* detelting the message, after getting the message */
        console.log(`deleting message: ${queueId}`);
        this.sqs.deleteMessage(
          {
            QueueUrl: this.queueUrl,
            ReceiptHandle: queueId,
          },
          () => {
            return resolve(`deletd`);
          }
        );
      } catch (error) {
        console.log(
          `something went wring while deleting messsage: ${error.messsage}`
        );
        return reject(error);
      }
    });
  };
}
