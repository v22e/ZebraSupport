const { Queue, Worker } = require("bullmq");
const { connection } = require("../config/redis");
const pool = require("../config/db");
const { getReplyByTopic } = require("./aiService");

const queueName = "ai-replies";
const replyQueue = new Queue(queueName, { connection });

const startQueueWorker = () => {
  const worker = new Worker(
    queueName,
    async (job) => {
      const { ticketId, topic } = job.data;
      const aiReply = getReplyByTopic(topic);
      if (!aiReply) return;

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await pool.query(
        `UPDATE tickets
         SET status = 'Auto-Replied', ai_reply = $1, is_read = false, updated_at = NOW()
         WHERE id = $2 AND status = 'Open'`,
        [aiReply, ticketId]
      );
    },
    { connection }
  );

  worker.on("failed", (job, error) => {
    console.error(`AI queue job failed for ticket ${job?.id}:`, error.message);
  });

  return worker;
};

const enqueueAutoReply = async ({ ticketId, topic }) => {
  if (!topic) return;
  await replyQueue.add("generate-reply", { ticketId, topic }, { attempts: 2, removeOnComplete: true });
};

module.exports = { startQueueWorker, enqueueAutoReply };