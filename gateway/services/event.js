const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
import amqp from 'amqplib';

let rabbitmqChannel; // RabbitMQ channel

export async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost'); // Replace with your RabbitMQ URL
    rabbitmqChannel = await connection.createChannel();
    const queue = 'analytics_queue'; // Name of the queue
    await rabbitmqChannel.assertQueue(queue, { durable: true }); // Ensure queue exists
    console.log('Connected to RabbitMQ');
    return rabbitmqChannel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    // Retry connection after a delay
    setTimeout(connectToRabbitMQ, 5000);
  }
}