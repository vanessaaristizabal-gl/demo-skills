// Fictional data: Bakery Brasa, an online ordering app. Nothing here is a real person, client or ticket.
// BL-007..BL-015 are what the meeting-notes skill extracts from the two sample transcripts.
// In this demo that extraction is pre-computed; in real use the skill does it.
const MEETING = "2026-10-06 Coupons and order tracking – Camila Torres";
const S = (t) => MEETING + " · " + t;

window.DEMO = {
  meetings: [
    {
      id: "m1", date: "2026-10-01", title: "Product daily – Camila Torres", processed: true, parts: 0,
      participants: ["Camila Torres", "Andrés Gil", "Laura Peña"],
      goals: "Plan the catalog and ordering work for the week.",
      topics: [
        ["", "Allergen information", "Camila Torres", "Customers ask which products contain nuts or gluten. A catalog filter was proposed."],
        ["", "Custom orders", "Andrés Gil", "The flow for custom cake orders is not documented anywhere."],
        ["", "Pastry orders", "Camila Torres", "Pastry orders are accepted with 48 hours' notice."],
        ["", "Sunday deliveries", "Laura Peña", "It is not known whether Sunday deliveries will be offered."]
      ],
      actions: ["**Camila Torres:** Add an allergen filter to the catalog.", "**Andrés Gil:** Document the custom order flow."],
      decisions: ["Pastry orders are accepted with 48 hours' notice."],
      related: ["Open question: Will we offer Sunday deliveries?", "Risk: The payment provider may reject recurring charges."]
    },
    {
      id: "m2", date: "2026-10-05", title: "Weekly planning – Laura Peña", processed: true, parts: 0,
      participants: ["Camila Torres", "Andrés Gil", "Laura Peña"],
      goals: "Prepare documentation and glossary work for the orders panel.",
      topics: [
        ["", "Orders panel manual", "Laura Peña", "A user manual is needed for the orders panel."],
        ["", "Catalog terms", "Camila Torres", "The glossary of catalog terms is out of date."]
      ],
      actions: ["**Laura Peña:** Prepare the user manual for the orders panel.", "**Camila Torres:** Update the catalog terms glossary."],
      decisions: ["Discount coupons are limited to one use per customer."],
      related: ["Open question: Do loyalty points expire?"]
    },
    {
      id: "m3", date: "2026-10-06", title: "Coupons and order tracking – Camila Torres", processed: false, parts: 2,
      participants: ["Camila Torres (Product)", "Andrés Gil (Developer)", "Laura Peña (Operations)", "Sofía Rojas (QA)"],
      goals: "Close the coupon rules before the weekend promo and decide what customers see after they pay.",
      topics: [
        ["00:01:05", "Coupon: one use per customer", "Camila Torres", "One use means one per customer account, not per device. Guests without an account cannot use coupons and are asked to sign in. A used coupon shows \"This coupon was already used on your account.\""],
        ["00:03:40", "Coupon applied twice on payment retry", "Andrés Gil", "If the payment provider retries a charge the discount doubles. It happened in staging last Thursday and the total went negative on a small order. Andrés will make the redemption idempotent, keyed by order and coupon."],
        ["00:06:10", "Order status page", "Camila Torres", "Customers ask where their order is. Statuses: Received, In the oven, Ready for pickup, Delivered, updated by counter staff with one tap."],
        ["00:07:30", "Ready-for-pickup notification", "Camila Torres", "Email, SMS or only the page is undecided. Camila will ask the marketing lead."],
        ["00:08:05", "Phases", "Camila Torres", "Phase 1 is what must be ready for Saturday's promo: coupon rule, double-application fix, status page, staff instructions, test cases and the rounding fix. Phase 2 can wait: notifications, CSV export, loyalty points."],
        ["00:14:30", "Rounding difference with tips", "Sofía Rojas", "With a tip the screen and the receipt differ by one cent: subtotal 12.35 plus a 15% tip shows 14.20 on screen and 14.21 on the receipt. The screen rounds the tip and the receipt rounds the total."],
        ["00:17:10", "Weekly sales report as CSV", "Laura Peña", "Finance asks for it every Monday. Not needed for the promo."],
        ["00:19:00", "Loyalty points expiry", "Sofía Rojas", "Unknown whether points expire. Camila will ask finance."],
        ["00:21:40", "Status page on a weak connection", "Laura Peña", "The counter loses Wi-Fi in the afternoon and the page could be slow. Idea: keep showing the last known status when offline."]
      ],
      actions: [
        "**Andrés Gil:** Make the coupon redemption idempotent, keyed by order and coupon (high).",
        "**Andrés Gil:** Fix the rounding difference between screen and receipt, after the coupon fix (high).",
        "**Laura Peña:** Write the counter-staff instructions for the order status page (medium).",
        "**Sofía Rojas:** Prepare test cases for coupons and the order status page (medium).",
        "**Camila Torres:** Ask the marketing lead which channel notifies a ready order.",
        "**Camila Torres:** Ask finance whether loyalty points expire.",
        "**Andrés Gil:** Build the weekly sales report CSV export when there is room (requested by Laura Peña, medium)."
      ],
      decisions: [
        "Coupons are limited to one use per customer account, not per device.",
        "Guests without an account cannot use coupons; they are asked to sign in.",
        "The order status page ships before any notification feature and is not blocked by the notification question.",
        "Phase 1 is everything needed for Saturday's promo; Phase 2 holds notifications, the CSV export and the loyalty points question."
      ],
      related: [
        "Open question: Which channel notifies a ready order: email, SMS or the page only? Owner: Camila Torres.",
        "Open question: Do loyalty points expire? Owner: Camila Torres, asking finance.",
        "Risk: A retried payment can apply a coupon twice. Owner: Andrés Gil.",
        "Risk: The status page can be slow on the counter's weak Wi-Fi. Mitigation idea, not decided: keep the last known status when offline.",
        "Earlier decision, 2026-10-05 weekly planning: discount coupons are limited to one use per customer."
      ]
    }
  ],

  // type = what the meeting-notes skill classified; jira = what GIH can create (Epic, Task, Subtask only)
  items: [
    { id: "BL-001", meeting: "m1", title: "Add an allergen filter to the catalog", type: "Task", area: "Catalog", owner: "Camila Torres", prio: "high", phase: "N/A", ticket: { key: "BAK-101", type: "Task", dummy: true },
      desc: "Customers need to filter the catalog by allergen.", source: "2026-10-01 Product daily", notes: "2026-10-01 — Add an allergen filter: [Requested by: Camila Torres.]", dev: "", ctx: "Customers need to filter the catalog by allergen. Raised in the 2026-10-01 product daily.", objective: "A catalog filter by allergen.", ac: [["Filter by allergen", "Happy path", "A customer filters the catalog by an allergen", "the catalog shows the products for the chosen allergen"]], refs: "Open question: whether the filter lists products that contain the allergen or products free of it.", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },
    { id: "BL-002", meeting: "m1", title: "Document the custom order flow", type: "Task", area: "Orders", owner: "Andrés Gil", prio: "medium", phase: "N/A", ticket: { key: "BAK-102", type: "Task", dummy: true },
      desc: "The flow for custom cake orders is not documented.", source: "2026-10-01 Product daily", notes: "2026-10-01 — Document the custom order flow.", dev: "", ctx: "The flow for custom cake orders is not documented anywhere.", objective: "Documentation of the custom order flow.", ac: [["Flow documented", "Happy path", "The custom order flow is reviewed with the people who run it", "a document describes the custom order flow"]], refs: "", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },
    { id: "BL-003", meeting: "m1", title: "Accept pastry orders only with 48 hours' notice", type: "Story", area: "Orders", owner: "Unassigned", prio: "medium", phase: "N/A", ticket: null,
      desc: "Pastry orders are accepted with 48 hours' notice.", source: "2026-10-01 Product daily", notes: "2026-10-01 — Decision recorded; no ticket yet.", dev: "", ctx: "Pastry orders need advance notice. Decided in the 2026-10-01 product daily.", story: "As the bakery, I want pastry orders accepted only with 48 hours' notice, so that the rule agreed on 2026-10-01 is applied.", ac: [["Order with enough notice", "Happy path", "A customer places a pastry order with at least 48 hours' notice", "the order is accepted"]], refs: "Open question: what a customer sees when ordering with less notice.", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },
    { id: "BL-004", meeting: "m1", title: "Find out whether Sunday deliveries will be offered", type: "Spike", area: "Delivery", owner: "Unassigned", prio: "low", phase: "N/A", ticket: null,
      desc: "It is not known whether Sunday deliveries will be offered.", source: "2026-10-01 Product daily", notes: "2026-10-01 — Open question from Laura Peña.", dev: "", ctx: "It is not known whether Sunday deliveries will be offered. Raised by Laura Peña in the 2026-10-01 product daily.", question: "Determine whether Sunday deliveries will be offered. Deliverable: the answer, recorded.", ac: [["Answer recorded", "Happy path", "Operations has answered", "whether Sunday deliveries will be offered is recorded in the meeting notes"]], refs: "", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },
    { id: "BL-005", meeting: "m2", title: "Prepare the user manual for the orders panel", type: "Task", area: "Orders panel", owner: "Laura Peña", prio: "medium", phase: "N/A", ticket: { key: "BAK-103", type: "Task", dummy: true },
      desc: "A user manual is needed for the orders panel.", source: "2026-10-05 Weekly planning", notes: "2026-10-05 — Prepare the manual: [Requested by: Laura Peña.]", dev: "", ctx: "A user manual is needed for the orders panel.", objective: "A user manual for the orders panel.", ac: [["Manual available", "Happy path", "The orders panel is available to its users", "a user manual for the orders panel is published"]], refs: "", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },
    { id: "BL-006", meeting: "m2", title: "Update the catalog terms glossary", type: "Task", area: "Catalog", owner: "Camila Torres", prio: "low", phase: "N/A", ticket: null,
      desc: "The glossary of catalog terms is out of date.", source: "2026-10-05 Weekly planning", notes: "2026-10-05 — Update the glossary.", dev: "", ctx: "The glossary of catalog terms is out of date.", objective: "An updated glossary of catalog terms.", ac: [["Glossary updated", "Happy path", "The catalog terms in use are reviewed", "the glossary lists the current catalog terms"]], refs: "", validation: "AC1 is traceable to the earlier meeting note and is the only criterion its source supports." },

    { id: "BL-007", meeting: "m3", title: "Limit coupons to one use per customer account", type: "Story", area: "Cart · Coupons", owner: "Andrés Gil", prio: "medium", phase: "1", ticket: null,
      desc: "Each coupon can be redeemed once per customer account, not per device. Guests who check out without an account cannot use coupons and are asked to sign in. A coupon already used shows \"This coupon was already used on your account.\"",
      source: S("00:01:05–00:02:42"), notes: "2026-10-06 — Limit coupons to one use per customer account: [Requested by: Camila Torres.] The one-use rule was first decided on 2026-10-05; this meeting defined the guest and message behaviour.", dev: "",
      ctx: "The weekend promo starts Saturday. The team already decided that coupons are one use per customer; this meeting defined what one use means and what customers see.",
      story: "As the bakery, I want each coupon limited to one use per customer account, so that the promotion follows the one-use-per-customer decision.",
      rules: "A guest without an account cannot use coupons.",
      ac: [
        ["Coupon used for the first time", "Happy path", "A signed-in customer applies a coupon their account has not used", "the discount is applied to the cart"],
        ["Coupon already used on the account", "Negative case", "A signed-in customer applies a coupon their account already used, from any device", "no discount is applied and the message \"This coupon was already used on your account.\" is shown, without an error code"],
        ["Guest checkout", "Negative case", "A customer without an account tries to apply a coupon", "the coupon is not applied and the customer is asked to sign in"]
      ],
      validation: "AC1–AC3 are testable, specific and traceable to 00:01:05–00:02:42. No edge case was added because the source supports none.",
      refs: "" },
    { id: "BL-008", meeting: "m3", title: "Prevent a coupon from being applied twice when a payment is retried", type: "Bug", area: "Cart · Payments", owner: "Andrés Gil", prio: "high", phase: "1", ticket: null,
      desc: "When the payment provider retries a charge, the cart can apply the coupon twice and the discount doubles. It happened in staging on Thursday 2026-10-01 and the total went negative on a small order.",
      source: S("00:03:40–00:04:30"), notes: "2026-10-06 — Prevent a double coupon on payment retry: [Requested by: Sofía Rojas, who saw it in staging.] High priority because the promo starts Saturday. Andrés Gil owns the fix.", dev: "",
      ctx: "Found in staging on Thursday 2026-10-01. Proposed approach (Andrés Gil): make the redemption idempotent, keyed by order and coupon.",
      steps: ["In staging, apply a coupon to a small order.", "Let the payment provider retry the charge."],
      expected: "The coupon is applied once per order, however many times the charge is retried.",
      current: "The coupon is applied again on the retry, the discount doubles and the total went negative on a small order.",
      ac: [
        ["Retried payment", "Edge case", "A payment is retried after a coupon was applied to the order", "the discount is applied once and the order total is the same as before the retry"],
        ["Small order with a coupon", "Edge case", "A coupon is applied to a small order and the charge is retried", "the order total is never negative"]
      ],
      validation: "AC1–AC2 are testable and traceable to 00:03:40–00:04:15. Both are edge cases; no happy-path or negative case is supported by the source.",
      refs: "Open question (Sofía Rojas): exact reproduction steps were not recorded in the meeting." },
    { id: "BL-009", meeting: "m3", title: "Show customers the status of their order", type: "Story", area: "Orders · Status page", owner: "Unassigned", prio: "medium", phase: "1", ticket: null,
      desc: "Customers can open a page showing their order status: Received, In the oven, Ready for pickup or Delivered. Counter staff update the status with one tap. The page ships before any notification feature.",
      source: S("00:06:10–00:07:02, 00:23:30"), notes: "2026-10-06 — Show the order status: [Requested by: Laura Peña, whose staff are asked all day.] Decision: ships before notifications (BL-013).", dev: "",
      ctx: "Customers ask \"where is my order?\" all day. The team agreed on a status page, updated by counter staff.",
      story: "As a customer, I want to see the status of my order, so that I do not have to ask where it is.",
      rules: "The status page ships before any notification feature and is not blocked by the notification question.",
      ac: [
        ["Customer checks an order", "Happy path", "A customer opens the status page for their order", "the page shows one of Received, In the oven, Ready for pickup or Delivered"],
        ["Staff update a status", "Happy path", "Counter staff change an order's status with one tap", "the customer's status page shows the new status"]
      ],
      validation: "AC1–AC2 are testable and traceable to 00:06:10–00:07:02. No edge or negative case is supported; the offline idea is recorded as a risk, not a requirement.",
      refs: "Risk: bad Wi-Fi at the counter in the afternoon can slow the page. Mitigation idea, not decided: keep showing the last known status when offline." },
    { id: "BL-010", meeting: "m3", title: "Write the counter-staff instructions for the order status page", type: "Task", area: "Orders · Status page", owner: "Laura Peña", prio: "medium", phase: "1", ticket: null,
      desc: "Written instructions that tell counter staff how to update an order's status with one tap, once the status page exists.",
      source: S("00:07:02"), notes: "2026-10-06 — Write the staff instructions: [Requested by: Laura Peña, who owns it.] Depends on BL-009.", dev: "",
      ctx: "Counter staff will update order statuses. Laura Peña will write their instructions once the status page exists.",
      objective: "Written instructions for counter staff on moving an order through Received, In the oven, Ready for pickup and Delivered with one tap.",
      ac: [["Instructions available", "Happy path", "The order status page is available to counter staff", "written instructions explain how to move an order through Received, In the oven, Ready for pickup and Delivered"]],
      validation: "AC1 is testable and traceable to 00:07:02. Nothing else is supported by the source.",
      refs: "Depends on the order status page story." },
    { id: "BL-011", meeting: "m3", title: "Fix the one-cent difference between screen and receipt on orders with tips", type: "Bug", area: "Orders · Totals", owner: "Andrés Gil", prio: "high", phase: "1", ticket: null,
      desc: "On orders with a tip, the total on screen and the total on the receipt differ by one cent. Subtotal 12.35 plus a 15% tip shows 14.20 on screen and 14.21 on the receipt. The screen rounds the tip and the receipt rounds the total.",
      source: S("00:14:22–00:15:33"), notes: "2026-10-06 — Fix the one-cent difference: [Requested by: Sofía Rojas, who found it.] High priority; Andrés Gil takes it after the coupon fix.", dev: "",
      ctx: "Found by QA (Sofía Rojas). Rounding is done in two places: the screen rounds the tip, the receipt rounds the total.",
      steps: ["Place an order with subtotal 12.35.", "Add a 15% tip.", "Compare the total on screen with the total on the receipt."],
      expected: "The total on screen and the total on the receipt are the same.",
      current: "The screen shows 14.20 and the receipt shows 14.21.",
      ac: [["Order with a tip", "Happy path", "A customer places an order with a tip, for example subtotal 12.35 and a 15% tip", "the total on screen and the total on the receipt are identical"]],
      validation: "AC1 is testable and traceable to 00:14:30–00:15:20. The source supports no edge or negative case.",
      refs: "Do after the coupon double-application fix (BL-008)." },
    { id: "BL-012", meeting: "m3", title: "Export the weekly sales report to CSV", type: "Task", area: "Reports", owner: "Andrés Gil", prio: "medium", phase: "2", ticket: null,
      desc: "A CSV export of the weekly sales report. Finance asks Laura for it every Monday. Not needed for the weekend promo; Andrés builds it when there is room.",
      source: S("00:17:10–00:17:25"), notes: "2026-10-06 — Export the weekly sales report to CSV: [Requested by: Laura Peña, for Finance.]", dev: "",
      ctx: "Finance asks Operations for the weekly sales report every Monday.",
      objective: "A CSV export of the weekly sales report.",
      ac: [["Weekly export", "Happy path", "A user requests the weekly sales report export", "a CSV file with the weekly sales report is produced"]],
      validation: "AC1 is testable and traceable to 00:17:10. The columns are not specified, so none were invented; see the open question.",
      refs: "Open question (Laura Peña): which columns does Finance need?" },
    { id: "BL-013", meeting: "m3", title: "Decide how customers are notified when an order is ready", type: "Spike", area: "Orders · Notifications", owner: "Camila Torres", prio: "medium", phase: "2", ticket: null,
      desc: "Decide whether a ready order is announced by email, by SMS or only on the status page. Camila Torres will ask the marketing lead.",
      source: S("00:07:30–00:07:41"), notes: "2026-10-06 — Decide the ready-for-pickup notification: [Requested by: Sofía Rojas.] Open question; does not block the status page.", dev: "",
      ctx: "The team could not say whether customers get a notification when an order is Ready for pickup.",
      question: "Decide which channel announces a ready order: email, SMS, or the status page only. Deliverable: the decision recorded, and a follow-up ticket if a notification is chosen.",
      ac: [["Channel decided", "Happy path", "The marketing lead has answered", "the chosen channel is recorded in the meeting notes, and a follow-up ticket exists if email or SMS was chosen"]],
      validation: "AC1 is testable and traceable to 00:07:30. The source supports no edge or negative case.",
      refs: "The order status page does not wait for this answer." },
    { id: "BL-014", meeting: "m3", title: "Find out whether loyalty points expire", type: "Spike", area: "Loyalty", owner: "Camila Torres", prio: "medium", phase: "2", ticket: null,
      desc: "It is not known whether loyalty points expire. Customers ask because the promo mentions points. Camila Torres will ask finance.",
      source: S("00:19:00–00:19:15"), notes: "2026-10-06 — Find out whether points expire: [Requested by: Sofía Rojas.] Also raised on 2026-10-05.", dev: "",
      ctx: "Customers ask whether loyalty points expire because the promo mentions points.",
      question: "Determine whether loyalty points expire. Deliverable: the answer from finance, recorded.",
      ac: [["Answer recorded", "Happy path", "Finance has answered", "whether points expire, and after how long if they do, is recorded in the meeting notes"]],
      validation: "AC1 is testable and traceable to 00:19:00. The source supports no edge or negative case.",
      refs: "" },
    { id: "BL-015", meeting: "m3", title: "Prepare test cases for coupons and the order status page", type: "Task", area: "QA", owner: "Sofía Rojas", prio: "medium", phase: "1", ticket: null,
      desc: "Test cases covering the coupon rules and the order status page.",
      source: S("00:24:10"), notes: "2026-10-06 — Prepare test cases: [Requested by: Sofía Rojas, who owns it.]", dev: "",
      ctx: "Coupons and the order status page both change this week.",
      objective: "Test cases for the coupon rules and the order status page.",
      ac: [["Test cases ready", "Happy path", "The coupon and status page stories are defined", "test cases cover one use per account, guest checkout, a retried payment and the four order statuses"]],
      validation: "AC1 is testable and traceable to 00:24:10. The list of covered cases comes from the items agreed in this meeting.",
      refs: "" }
  ]
};
