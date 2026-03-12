const { Queue, Worker } = require("bullmq");
const { connection } = require("../config/redis");
const pool = require("../config/db");
const { getReplyByTopic } = require("./aiService");
const { createNotificationsForUsers, getOrgUsersByRoles } = require("./notificationService");

const queueName = "ai-replies";
const replyQueue = new Queue(queueName, { connection });

const startQueueWorker = () => {
  const worker = new Worker(
    queueName,
    async (job) => {
      const { ticketId, topic, orgId } = job.data;
      const aiReply = getReplyByTopic(topic);
      if (!aiReply) return;

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const { rows } = await pool.query(
        `UPDATE tickets
         SET status = 'Auto-Replied', ai_reply = $1, is_read = false, updated_at = NOW()
         WHERE id = $2 AND org_id = $3 AND status = 'Open'
         RETURNING id, subject`,
        [aiReply, ticketId, orgId]
      );

      const ticket = rows[0];
      if (!ticket) {
        return;
      }

      const adminAndOwnerIds = await getOrgUsersByRoles(orgId, ["org_owner", "org_admin"]);
      await createNotificationsForUsers(adminAndOwnerIds, {
        orgId,
        type: "ticket_auto_replied",
        title: `AI auto-replied to ticket #${ticket.id}`,
        body: `ZebraSupport automatically responded to: ${ticket.subject}`,
        link: `/admin/tickets/${ticket.id}`
      });
    },
    { connection }
  );

  worker.on("failed", (job, error) => {
    console.error(`AI queue job failed for ticket ${job?.id}:`, error.message);
  });

  return worker;
};

const enqueueAutoReply = async ({ ticketId, topic, orgId }) => {
  if (!topic) return;
  await replyQueue.add("generate-reply", { ticketId, topic, orgId }, { attempts: 2, removeOnComplete: true });
};

module.exports = { startQueueWorker, enqueueAutoReply };
