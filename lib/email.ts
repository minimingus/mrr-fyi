async function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const { Resend } = await import("resend");
  return new Resend(process.env.RESEND_API_KEY);
}

const BRAND = {
  amber: "#f59e0b",
  amberDark: "#d97706",
  bg: "#09090b",
  card: "#111113",
  border: "#27272a",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  emerald: "#10b981",
  red: "#ef4444",
};

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>MRR.fyi</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:${BRAND.amber};letter-spacing:-0.5px;">MRR.fyi</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
                The public indie revenue leaderboard.<br />
                <a href="https://mrr.fyi" style="color:${BRAND.textMuted};text-decoration:underline;">mrr.fyi</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${BRAND.amber};border-radius:6px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:${BRAND.bg};text-decoration:none;border-radius:6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export async function sendVerificationEmail(
  email: string,
  productName: string,
  verifyToken: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify/${verifyToken}`;

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      Verify your email
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      You submitted <strong style="color:${BRAND.text};">${productName}</strong> to MRR.fyi. Click below to verify your email and go live on the leaderboard.
    </p>
    ${button("Verify my email", verifyUrl)}
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
      Or copy this URL:<br />
      <a href="${verifyUrl}" style="color:${BRAND.amber};text-decoration:none;word-break:break-all;font-size:12px;">${verifyUrl}</a>
    </p>
  `);

  const text = `Verify your email for ${productName} on MRR.fyi.\n\nClick here to verify: ${verifyUrl}\n\nOnce verified, your profile will go live on the leaderboard.\n\n— MRR.fyi`;

  const resend = await getResend();
  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `Verify your email for ${productName} on MRR.fyi`,
    text,
    html,
  });
}

export async function sendUpdateLink(
  email: string,
  productName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updateUrl = `${appUrl}/update/${token}`;

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      You're on the leaderboard
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      <strong style="color:${BRAND.text};">${productName}</strong> was added to MRR.fyi. Save this email — the link below is how you update your revenue number.
    </p>
    ${button("Update my MRR", updateUrl)}
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
      Or copy this URL:<br />
      <a href="${updateUrl}" style="color:${BRAND.amber};text-decoration:none;word-break:break-all;font-size:12px;">${updateUrl}</a>
    </p>
  `);

  const text = `Your product "${productName}" was added to MRR.fyi.\n\nTo update your MRR, visit: ${updateUrl}\n\nSave this link — it lets you update your revenue on the leaderboard.\n\n— MRR.fyi`;

  const resend = await getResend();
  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `${productName} is on MRR.fyi — save your update link`,
    text,
    html,
  });
}

export async function sendMonthlyDigest(
  email: string,
  productName: string,
  mrrCents: number,
  currency: string,
  currentRank: number,
  previousRank: number | null,
  top3: { productName: string; mrr: number; currency: string }[],
  updateToken: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const mrr = (mrrCents / 100).toLocaleString("en-US");

  const rankChange =
    previousRank !== null
      ? previousRank - currentRank // positive = moved up
      : null;
  const rankColor =
    rankChange !== null && rankChange > 0
      ? BRAND.emerald
      : rankChange !== null && rankChange < 0
        ? BRAND.red
        : BRAND.textMuted;
  const rankArrow =
    rankChange !== null && rankChange > 0
      ? "&#9650;"
      : rankChange !== null && rankChange < 0
        ? "&#9660;"
        : "";
  const rankChangeText =
    rankChange !== null && rankChange !== 0
      ? `<span style="font-size:13px;color:${rankColor};margin-left:6px;">${rankArrow} ${Math.abs(rankChange)}</span>`
      : previousRank === null
        ? `<span style="font-size:13px;color:${BRAND.textMuted};margin-left:6px;">New</span>`
        : "";

  const top3Rows = top3
    .map(
      (entry, i) => {
        const s = entry.currency === "EUR" ? "€" : entry.currency === "GBP" ? "£" : "$";
        const m = (entry.mrr / 100).toLocaleString("en-US");
        return `<tr>
        <td style="padding:8px 12px;font-size:14px;color:${BRAND.textMuted};border-bottom:1px solid ${BRAND.border};">#${i + 1}</td>
        <td style="padding:8px 12px;font-size:14px;color:${BRAND.text};border-bottom:1px solid ${BRAND.border};">${entry.productName}</td>
        <td style="padding:8px 12px;font-size:14px;color:${BRAND.text};text-align:right;border-bottom:1px solid ${BRAND.border};">${s}${m}</td>
      </tr>`;
      }
    )
    .join("");

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      Your monthly digest
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      Here's how <strong style="color:${BRAND.text};">${productName}</strong> is doing on the leaderboard this month.
    </p>
    <!-- Stats card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;margin-bottom:20px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Current MRR</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.text};letter-spacing:-0.5px;">${symbol}${mrr}</p>
          <p style="margin:12px 0 0;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Leaderboard Rank</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:${BRAND.text};">#${currentRank}${rankChangeText}</p>
        </td>
      </tr>
    </table>
    <!-- Top 3 -->
    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Top 3 on the leaderboard</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;">
      ${top3Rows}
    </table>
    ${button("Update my MRR", `${appUrl}/update/${updateToken}`)}
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
      View the full leaderboard at <a href="${appUrl}" style="color:${BRAND.amber};text-decoration:none;">mrr.fyi</a>
    </p>
  `);

  const rankChangeTextPlain =
    rankChange !== null && rankChange !== 0
      ? ` (${rankChange > 0 ? "up" : "down"} ${Math.abs(rankChange)})`
      : "";
  const top3Plain = top3
    .map((entry, i) => {
      const s = entry.currency === "EUR" ? "€" : entry.currency === "GBP" ? "£" : "$";
      return `  ${i + 1}. ${entry.productName} — ${s}${(entry.mrr / 100).toLocaleString("en-US")}`;
    })
    .join("\n");
  const text = `Monthly digest for ${productName}\n\nCurrent MRR: ${symbol}${mrr}\nLeaderboard rank: #${currentRank}${rankChangeTextPlain}\n\nTop 3:\n${top3Plain}\n\nUpdate your MRR: ${appUrl}/update/${updateToken}\n\n— MRR.fyi`;

  const resendClient = await getResend();
  await resendClient.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `${productName} — your monthly MRR digest`,
    text,
    html,
  });
}

export async function sendUpdateConfirmation(
  email: string,
  productName: string,
  newMrrCents: number,
  oldMrrCents: number,
  rank: number | null,
  currency: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const newMrr = (newMrrCents / 100).toLocaleString("en-US");
  const oldMrr = (oldMrrCents / 100).toLocaleString("en-US");

  const diff = newMrrCents - oldMrrCents;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const changeColor = isUp ? BRAND.emerald : isDown ? BRAND.red : BRAND.textMuted;
  const changeArrow = isUp ? "&#9650;" : isDown ? "&#9660;" : "";
  const changeText = diff !== 0
    ? `${changeArrow} ${symbol}${Math.abs(diff / 100).toLocaleString("en-US")}`
    : "No change";

  const rankLine = rank
    ? `<p style="margin:16px 0 0;font-size:13px;color:${BRAND.textMuted};">Leaderboard rank: <strong style="color:${BRAND.text};">#${rank}</strong></p>`
    : "";

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      MRR updated
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      Your revenue for <strong style="color:${BRAND.text};">${productName}</strong> has been recorded.
    </p>
    <!-- MRR card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">New MRR</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.text};letter-spacing:-0.5px;">
            ${symbol}${newMrr}
            <span style="font-size:14px;font-weight:500;color:${changeColor};margin-left:8px;">${changeText}</span>
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:${BRAND.textMuted};">Previously: ${symbol}${oldMrr}</p>
          ${rankLine}
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
      View the leaderboard at <a href="${appUrl}" style="color:${BRAND.amber};text-decoration:none;">mrr.fyi</a>
    </p>
  `);

  const rankText = rank ? `\nLeaderboard rank: #${rank}` : "";
  const text = `MRR updated for ${productName}.\n\nNew MRR: ${symbol}${newMrr} (was ${symbol}${oldMrr})${rankText}\n\nView the leaderboard: ${appUrl}\n\n— MRR.fyi`;

  const resend = await getResend();
  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `${productName} — MRR updated to ${symbol}${newMrr}`,
    text,
    html,
  });
}

export async function sendChurnRecoveryEmail(
  email: string,
  productName: string,
  planType: "FEATURED" | "VERIFIED",
  slug: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const profileUrl = `${appUrl}/${slug}`;
  const planLabel = planType === "FEATURED" ? "Featured" : "Verified";

  const loseFeature =
    planType === "FEATURED"
      ? "top placement on the leaderboard and your Featured badge"
      : "your Verified badge";

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      Your ${planLabel} subscription was cancelled
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      We get it — things change. Your profile for <strong style="color:${BRAND.text};">${productName}</strong> will stay on MRR.fyi, but you'll lose ${loseFeature}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;margin-bottom:20px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">What you'll lose</p>
          <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.6;">${loseFeature}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      If you change your mind, you can re-subscribe anytime from your profile.
    </p>
    ${button("View your profile", profileUrl)}
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;">
      No hard feelings. We're rooting for you either way.
    </p>
  `);

  const text = `Your ${planLabel} subscription for ${productName} on MRR.fyi was cancelled.\n\nYour profile will stay on the leaderboard, but you'll lose ${loseFeature}.\n\nIf you change your mind, re-subscribe anytime: ${profileUrl}\n\n— MRR.fyi`;

  const resend = await getResend();
  await resend.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `Your ${planLabel} plan for ${productName} was cancelled`,
    text,
    html,
  });
}

export async function sendMilestoneReached(
  email: string,
  productName: string,
  milestoneAmountCents: number,
  currency: string,
  slug: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const milestone = (milestoneAmountCents / 100).toLocaleString("en-US");
  const profileUrl = `${appUrl}/${slug}`;

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text};">
      ${symbol}${milestone}/mo reached
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
      <strong style="color:${BRAND.text};">${productName}</strong> just crossed the <strong style="color:${BRAND.amber};">${symbol}${milestone}/mo</strong> milestone. Nice work.
    </p>
    <!-- Milestone badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <span style="font-size:36px;">&#127942;</span>
          <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:${BRAND.amber};letter-spacing:-0.5px;">
            ${symbol}${milestone}/mo
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">
            Milestone unlocked
          </p>
        </td>
      </tr>
    </table>
    ${button("View your profile", profileUrl)}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
      A milestone badge has been added to your <a href="${profileUrl}" style="color:${BRAND.amber};text-decoration:none;">profile</a>.
    </p>
  `);

  const text = `Congrats! ${productName} just crossed ${symbol}${milestone}/mo on MRR.fyi.\n\nA milestone badge has been added to your profile: ${profileUrl}\n\n— MRR.fyi`;

  const resendClient = await getResend();
  await resendClient.emails.send({
    from: "MRR.fyi <onboarding@resend.dev>",
    to: email,
    subject: `${productName} hit ${symbol}${milestone}/mo`,
    text,
    html,
  });
}
