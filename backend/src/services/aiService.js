const faqMap = [
  {
    topic: "Password Reset",
    keywords: ["password", "reset", "forgot"],
    reply:
      "Hi there, you can reset your password from the login page by clicking \"Forgot Password\". If the reset email does not arrive within 2 minutes, please check spam or ask your admin to whitelist support@zebrasupport.io."
  },
  {
    topic: "Billing Query",
    keywords: ["billing", "invoice", "charge", "payment"],
    reply:
      "Thanks for reaching out. Billing invoices are generated on the 1st of each month in your Billing tab. If you see a mismatch, reply with the invoice number and we will investigate immediately."
  },
  {
    topic: "Account Access",
    keywords: ["access", "login", "signin", "locked"],
    reply:
      "It looks like an account access request. Please confirm your workspace name and user email. In many cases, re-inviting the user from Settings > Team resolves this issue right away."
  },
  {
    topic: "API Integration",
    keywords: ["api", "webhook", "integration", "token"],
    reply:
      "For API integration issues, verify your API key scope and webhook endpoint response codes. ZebraSupport expects a 2xx response for successful webhook delivery."
  },
  {
    topic: "SLA & Priority",
    keywords: ["sla", "priority", "urgent", "escalate"],
    reply:
      "We detected an SLA or priority question. High-priority tickets are routed first; you can adjust priority rules under Admin Settings > Automation."
  }
];

const classifyTicket = ({ subject = "", description = "" }) => {
  const text = `${subject} ${description}`.toLowerCase();

  for (const rule of faqMap) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return { topic: rule.topic, aiReply: rule.reply };
    }
  }

  return { topic: null, aiReply: null };
};

const getReplyByTopic = (topic) => faqMap.find((item) => item.topic === topic)?.reply || null;

module.exports = { classifyTicket, getReplyByTopic, faqMap };