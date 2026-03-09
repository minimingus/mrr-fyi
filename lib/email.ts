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
    subject: `${productName} is on MRR.fyi — save your update link`,
    text: `Hi,\n\nYour product "${productName}" was added to MRR.fyi.\n\nTo update your MRR in the future, visit:\n${updateUrl}\n\nSave this link — it lets you update your revenue number on the leaderboard.\n\n— MRR.fyi`,
    html: `
      <p>Hi,</p>
      <p>Your product <strong>${productName}</strong> was added to <a href="https://mrr-fyi.vercel.app">MRR.fyi</a>.</p>
      <p>To update your MRR in the future, use this link:</p>
      <p><a href="${updateUrl}">Update my MRR for ${productName}</a></p>
      <p>Save this email so you can find it next time you want to update your revenue.</p>
      <p>— MRR.fyi</p>
    `,
  });
}
