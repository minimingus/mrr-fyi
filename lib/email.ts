import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUpdateLink(
  email: string,
  productName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updateUrl = `${appUrl}/update/${token}`;

  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `Update your MRR — ${productName}`,
    html: `
      <p>Hey 👋</p>
      <p>Here's your personal link to update the MRR for <strong>${productName}</strong> on MRR.fyi:</p>
      <p><a href="${updateUrl}" style="font-size:18px;font-weight:bold;">${updateUrl}</a></p>
      <p>Bookmark this link — it's the only way to update your revenue. It never expires.</p>
      <p>— MRR.fyi</p>
    `,
  });
}
