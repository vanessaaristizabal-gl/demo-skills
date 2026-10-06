# 2026-10-06 Coupons and order tracking – Camila Torres

## Date
2026-10-06

## Participants
- @Camila Torres (Product)
- @Andrés Gil (Developer)
- @Laura Peña (Operations)
- @Sofía Rojas (QA)

## Goals
Close the coupon rules before the weekend promo and decide what customers see after they pay.

## Discussion topics
| Time | Topic | Presenter | Notes |
| --- | --- | --- | --- |
| 00:01:05 | **Coupon: one use per customer** | @Camila Torres | One use means one per customer account, not per device. Guests without an account cannot use coupons and are asked to sign in. A used coupon shows "This coupon was already used on your account." |
| 00:03:40 | **Coupon applied twice on payment retry** | @Andrés Gil | If the payment provider retries a charge the discount doubles. It happened in staging last Thursday and the total went negative on a small order. Andrés will make the redemption idempotent, keyed by order and coupon. |
| 00:06:10 | **Order status page** | @Camila Torres | Customers ask where their order is. Statuses: Received, In the oven, Ready for pickup, Delivered, updated by counter staff with one tap. |
| 00:07:30 | **Ready-for-pickup notification** | @Camila Torres | Email, SMS or only the page is undecided. Camila will ask the marketing lead. |
| 00:08:05 | **Phases** | @Camila Torres | Phase 1 is what must be ready for Saturday's promo: coupon rule, double-application fix, status page, staff instructions, test cases and the rounding fix. Phase 2 can wait: notifications, CSV export, loyalty points. |
| 00:14:30 | **Rounding difference with tips** | @Sofía Rojas | With a tip the screen and the receipt differ by one cent: subtotal 12.35 plus a 15% tip shows 14.20 on screen and 14.21 on the receipt. The screen rounds the tip and the receipt rounds the total. |
| 00:17:10 | **Weekly sales report as CSV** | @Laura Peña | Finance asks for it every Monday. Not needed for the promo. |
| 00:19:00 | **Loyalty points expiry** | @Sofía Rojas | Unknown whether points expire. Camila will ask finance. |
| 00:21:40 | **Status page on a weak connection** | @Laura Peña | The counter loses Wi-Fi in the afternoon and the page could be slow. Idea: keep showing the last known status when offline. |

## Action items
- [ ] **Andrés Gil:** Make the coupon redemption idempotent, keyed by order and coupon (high).
- [ ] **Andrés Gil:** Fix the rounding difference between screen and receipt, after the coupon fix (high).
- [ ] **Laura Peña:** Write the counter-staff instructions for the order status page (medium).
- [ ] **Sofía Rojas:** Prepare test cases for coupons and the order status page (medium).
- [ ] **Camila Torres:** Ask the marketing lead which channel notifies a ready order.
- [ ] **Camila Torres:** Ask finance whether loyalty points expire.
- [ ] **Andrés Gil:** Build the weekly sales report CSV export when there is room (requested by Laura Peña, medium).

## Decisions
- Coupons are limited to one use per customer account, not per device.
- Guests without an account cannot use coupons; they are asked to sign in.
- The order status page ships before any notification feature and is not blocked by the notification question.
- Phase 1 is everything needed for Saturday's promo; Phase 2 holds notifications, the CSV export and the loyalty points question.

## Related info
- Open question: Which channel notifies a ready order: email, SMS or the page only? Owner: Camila Torres.
- Open question: Do loyalty points expire? Owner: Camila Torres, asking finance.
- Risk: A retried payment can apply a coupon twice. Owner: Andrés Gil.
- Risk: The status page can be slow on the counter's weak Wi-Fi. Mitigation idea, not decided: keep the last known status when offline.
- Earlier decision, 2026-10-05 weekly planning: discount coupons are limited to one use per customer.

---

# Backlog items

| Backlog Item | Area | Description | Source/Meeting | Jira Ticket | Notes | Development Notes | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Limit coupons to one use per customer account (Story, medium, Andrés Gil) | Cart · Coupons | Each coupon can be redeemed once per customer account, not per device. Guests who check out without an account cannot use coupons and are asked to sign in. A coupon already used shows "This coupon was already used on your account." | 2026-10-06 Coupons and order tracking – Camila Torres · 00:01:05–00:02:42 | — | 2026-10-06 — Limit coupons to one use per customer account: [Requested by: Camila Torres.] The one-use rule was first decided on 2026-10-05; this meeting defined the guest and message behaviour. |  | 1 |
| Prevent a coupon from being applied twice when a payment is retried (Bug, high, Andrés Gil) | Cart · Payments | When the payment provider retries a charge, the cart can apply the coupon twice and the discount doubles. It happened in staging on Thursday 2026-10-01 and the total went negative on a small order. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:03:40–00:04:30 | — | 2026-10-06 — Prevent a double coupon on payment retry: [Requested by: Sofía Rojas, who saw it in staging.] High priority because the promo starts Saturday. Andrés Gil owns the fix. |  | 1 |
| Show customers the status of their order (Story, medium, Unassigned) | Orders · Status page | Customers can open a page showing their order status: Received, In the oven, Ready for pickup or Delivered. Counter staff update the status with one tap. The page ships before any notification feature. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:06:10–00:07:02, 00:23:30 | — | 2026-10-06 — Show the order status: [Requested by: Laura Peña, whose staff are asked all day.] Decision: ships before notifications (BL-013). |  | 1 |
| Write the counter-staff instructions for the order status page (Task, medium, Laura Peña) | Orders · Status page | Written instructions that tell counter staff how to update an order's status with one tap, once the status page exists. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:07:02 | — | 2026-10-06 — Write the staff instructions: [Requested by: Laura Peña, who owns it.] Depends on BL-009. |  | 1 |
| Fix the one-cent difference between screen and receipt on orders with tips (Bug, high, Andrés Gil) | Orders · Totals | On orders with a tip, the total on screen and the total on the receipt differ by one cent. Subtotal 12.35 plus a 15% tip shows 14.20 on screen and 14.21 on the receipt. The screen rounds the tip and the receipt rounds the total. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:14:22–00:15:33 | — | 2026-10-06 — Fix the one-cent difference: [Requested by: Sofía Rojas, who found it.] High priority; Andrés Gil takes it after the coupon fix. |  | 1 |
| Export the weekly sales report to CSV (Task, medium, Andrés Gil) | Reports | A CSV export of the weekly sales report. Finance asks Laura for it every Monday. Not needed for the weekend promo; Andrés builds it when there is room. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:17:10–00:17:25 | — | 2026-10-06 — Export the weekly sales report to CSV: [Requested by: Laura Peña, for Finance.] |  | 2 |
| Decide how customers are notified when an order is ready (Spike, medium, Camila Torres) | Orders · Notifications | Decide whether a ready order is announced by email, by SMS or only on the status page. Camila Torres will ask the marketing lead. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:07:30–00:07:41 | — | 2026-10-06 — Decide the ready-for-pickup notification: [Requested by: Sofía Rojas.] Open question; does not block the status page. |  | 2 |
| Find out whether loyalty points expire (Spike, medium, Camila Torres) | Loyalty | It is not known whether loyalty points expire. Customers ask because the promo mentions points. Camila Torres will ask finance. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:19:00–00:19:15 | — | 2026-10-06 — Find out whether points expire: [Requested by: Sofía Rojas.] Also raised on 2026-10-05. |  | 2 |
| Prepare test cases for coupons and the order status page (Task, medium, Sofía Rojas) | QA | Test cases covering the coupon rules and the order status page. | 2026-10-06 Coupons and order tracking – Camila Torres · 00:24:10 | — | 2026-10-06 — Prepare test cases: [Requested by: Sofía Rojas, who owns it.] |  | 1 |
