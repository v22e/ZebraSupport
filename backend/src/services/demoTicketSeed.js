const demoTicketSeed = [
  {
    subject: "Password reset link never arrives",
    description: "Our finance lead is not receiving reset links. Can you help?",
    requesterName: "Maya Patel",
    requesterEmail: "maya.patel@northbridge-ops.com",
    company: "Northbridge Ops",
    status: "Auto-Replied",
    priority: "Low",
    topic: "Password Reset"
  },
  {
    subject: "Invoice amount mismatch for February",
    description: "The invoice appears to include extra seats that were removed.",
    requesterName: "Leo Martinez",
    requesterEmail: "leo.martinez@crestlinebio.com",
    company: "Crestline Bio",
    status: "Escalated",
    priority: "High",
    topic: "Billing Query"
  },
  {
    subject: "Cannot login after SSO update",
    description: "Multiple team members are blocked after changing identity provider settings.",
    requesterName: "Priya Nair",
    requesterEmail: "priya.nair@vectorworks.ai",
    company: "VectorWorks AI",
    status: "Open",
    priority: "High",
    topic: "Account Access"
  },
  {
    subject: "Webhook retries failing",
    description: "Our webhook endpoint returns 500 on retries and some events are missing.",
    requesterName: "Ben Collins",
    requesterEmail: "ben.collins@atlasfintech.io",
    company: "Atlas Fintech",
    status: "Auto-Replied",
    priority: "Medium",
    topic: "API Integration"
  },
  {
    subject: "Urgent escalation policy advice",
    description: "What is the best way to route urgent SLA tickets for enterprise customers?",
    requesterName: "Harper Nguyen",
    requesterEmail: "harper.nguyen@blueridgehealth.co",
    company: "Blue Ridge Health",
    status: "Auto-Replied",
    priority: "High",
    topic: "SLA & Priority"
  },
  {
    subject: "Slow dashboard load for APAC region",
    description: "Analytics dashboard takes over 12 seconds in Singapore offices.",
    requesterName: "Yuki Tan",
    requesterEmail: "yuki.tan@solariscommerce.com",
    company: "Solaris Commerce",
    status: "Open",
    priority: "Medium",
    topic: null
  },
  {
    subject: "Export CSV includes duplicate records",
    description: "Issue observed in version 2.4.",
    requesterName: "Omar Hassan",
    requesterEmail: "omar.hassan@windmarklogistics.com",
    company: "Windmark Logistics",
    status: "Closed",
    priority: "Low",
    topic: null
  },
  {
    subject: "Password reset for contractor account",
    description: "Temporary contractor no longer receives access code.",
    requesterName: "Nina Kline",
    requesterEmail: "nina.kline@novaviewmedia.com",
    company: "NovaView Media",
    status: "Auto-Replied",
    priority: "Low",
    topic: "Password Reset"
  },
  {
    subject: "Need prorated billing explanation",
    description: "Can you explain prorated billing when we add seats mid-cycle?",
    requesterName: "Carlos Diaz",
    requesterEmail: "carlos.diaz@peakstonelegal.com",
    company: "Peakstone Legal",
    status: "Auto-Replied",
    priority: "Medium",
    topic: "Billing Query"
  },
  {
    subject: "Support inbox is empty after migration",
    description: "After migrating workspace, old ticket history is not visible.",
    requesterName: "Grace Kim",
    requesterEmail: "grace.kim@lumen-industrial.com",
    company: "Lumen Industrial",
    status: "Escalated",
    priority: "High",
    topic: null
  },
  {
    subject: "API key scope question",
    description: "Is there a read-only token for external reporting tools?",
    requesterName: "Sofia Brooks",
    requesterEmail: "sofia.brooks@everfieldenergy.com",
    company: "EverField Energy",
    status: "Auto-Replied",
    priority: "Low",
    topic: "API Integration"
  },
  {
    subject: "Account access restored",
    description: "User was removed from workspace accidentally and re-invited.",
    requesterName: "Quinn Harper",
    requesterEmail: "quinn.harper@arcmedsystems.com",
    company: "ArcMed Systems",
    status: "Closed",
    priority: "Medium",
    topic: "Account Access"
  },
  {
    subject: "High priority outage alert",
    description: "The widget is down for all EMEA users.",
    requesterName: "Ethan Price",
    requesterEmail: "ethan.price@meridianfleet.com",
    company: "Meridian Fleet",
    status: "Open",
    priority: "High",
    topic: null
  },
  {
    subject: "Bulk user import failure",
    description: "CSV import stalls at 60% for 10k users.",
    requesterName: "Amelia Ross",
    requesterEmail: "amelia.ross@hollowayretail.com",
    company: "Holloway Retail",
    status: "Escalated",
    priority: "High",
    topic: null
  },
  {
    subject: "Prioritize VIP customer queues",
    description: "Need best practice for priority scoring with VIP segments.",
    requesterName: "Theo Mitchell",
    requesterEmail: "theo.mitchell@copperleafbank.com",
    company: "Copperleaf Bank",
    status: "Auto-Replied",
    priority: "Medium",
    topic: "SLA & Priority"
  },
  {
    subject: "Need account unlock for legal team",
    description: "Three legal reviewers are locked out after MFA reset.",
    requesterName: "Liam Turner",
    requesterEmail: "liam.turner@oakridgepartners.com",
    company: "Oakridge Partners",
    status: "Open",
    priority: "High",
    topic: "Account Access"
  },
  {
    subject: "Update billing contact",
    description: "Please change billing contact to new procurement lead.",
    requesterName: "Chloe Ward",
    requesterEmail: "chloe.ward@primexmanufacturing.com",
    company: "PrimeX Manufacturing",
    status: "Closed",
    priority: "Low",
    topic: "Billing Query"
  },
  {
    subject: "Webhook signature mismatch",
    description: "Webhook signatures fail verification in staging.",
    requesterName: "Noah Rivera",
    requesterEmail: "noah.rivera@silverpinehotels.com",
    company: "Silverpine Hotels",
    status: "Open",
    priority: "Medium",
    topic: "API Integration"
  },
  {
    subject: "Password issue for employee",
    description: "Employee accidentally changed password twice and is blocked.",
    requesterName: "Ava Johnson",
    requesterEmail: "ava.johnson@brookfieldinsure.com",
    company: "Brookfield Insure",
    status: "Auto-Replied",
    priority: "Low",
    topic: "Password Reset"
  },
  {
    subject: "Analytics totals inconsistent",
    description: "Totals on dashboard and exports differ by about 4%.",
    requesterName: "Mason Reed",
    requesterEmail: "mason.reed@redclifftelecom.com",
    company: "Redcliff Telecom",
    status: "Open",
    priority: "Medium",
    topic: null
  },
  {
    subject: "SLA workflow confirmation",
    description: "Need confirmation that SLA automation was enabled correctly.",
    requesterName: "Ella Brooks",
    requesterEmail: "ella.brooks@skybridgeventures.io",
    company: "Skybridge Ventures",
    status: "Closed",
    priority: "Low",
    topic: "SLA & Priority"
  },
  {
    subject: "Team member cannot receive invite",
    description: "Invite emails bounce for one partner domain.",
    requesterName: "Lucas Green",
    requesterEmail: "lucas.green@vanguardagri.co",
    company: "Vanguard Agri",
    status: "Open",
    priority: "Medium",
    topic: "Account Access"
  },
  {
    subject: "Billing VAT question",
    description: "How should VAT be displayed on EU invoices?",
    requesterName: "Mila Carter",
    requesterEmail: "mila.carter@clearwatermed.com",
    company: "Clearwater Medical",
    status: "Auto-Replied",
    priority: "Low",
    topic: "Billing Query"
  },
  {
    subject: "Mobile app crashes on thread view",
    description: "Android app crashes when opening long ticket conversations.",
    requesterName: "James Cook",
    requesterEmail: "james.cook@fusionfreight.io",
    company: "Fusion Freight",
    status: "Escalated",
    priority: "High",
    topic: null
  },
  {
    subject: "Bulk-close resolved tickets",
    description: "Looking for bulk action tools to close stale tickets.",
    requesterName: "Aria Shah",
    requesterEmail: "aria.shah@newharborcapital.com",
    company: "New Harbor Capital",
    status: "Open",
    priority: "Low",
    topic: null
  },
  {
    subject: "Account permissions for contractors",
    description: "Need read-only access for temporary vendor users.",
    requesterName: "Dylan Fox",
    requesterEmail: "dylan.fox@pinebridgeinfra.com",
    company: "Pinebridge Infra",
    status: "Auto-Replied",
    priority: "Medium",
    topic: "Account Access"
  }
];

module.exports = {
  demoTicketSeed
};
