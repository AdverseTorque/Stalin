// ONE-TIME, LOCAL, INTERACTIVE: run this yourself in your own terminal —
//   npm run telegram:login
// It logs in to YOUR Telegram account, lists your broadcast channels (so you
// can choose which to ingest), and prints a session string to paste into
// the GitHub secret TELEGRAM_SESSION.
//
// Deliberately writes NOTHING to disk: the session string is full access to
// your Telegram account. It is printed once, here, and nowhere else — not
// to .env.local, not to any log. Never paste it into a chat or commit it.
// If it ever leaks: Telegram app -> Settings -> Devices -> terminate it.
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions";

async function main() {
  const rl = createInterface({ input, output });
  console.log("\nSITREP — Telegram login (runs only on this machine)\n");
  console.log("Get API ID + API hash at https://my.telegram.org -> API development tools.\n");

  const apiId = Number((await rl.question("API ID: ")).trim());
  const apiHash = (await rl.question("API hash: ")).trim();
  if (!Number.isInteger(apiId) || apiId <= 0 || !/^[0-9a-f]{32}$/i.test(apiHash)) {
    console.error("That doesn't look like a valid API ID (number) / API hash (32 hex characters).");
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 3 });
  await client.start({
    phoneNumber: () => rl.question("Phone number (with country code, e.g. +91...): "),
    phoneCode: () => rl.question("Login code Telegram just sent you: "),
    password: () => rl.question("Two-step verification password (shown as you type): "),
    onError: (err) => console.error("Login error:", err.message),
  });

  const dialogs = await client.getDialogs({});
  // Broadcast channels only — supergroups also report isChannel, see
  // src/lib/sources/adapters/telegram-mtproto.ts.
  const channels = dialogs.filter((d) => d.isChannel && !d.isGroup);
  console.log(`\nYour broadcast channels (${channels.length}) — groups and private chats are never read:\n`);
  for (const d of channels) {
    const e = d.entity as { username?: string; id?: { toString(): string }; title?: string };
    console.log(`  ${e.username ? `@${e.username}` : `id:${e.id?.toString()}`}  —  ${e.title ?? ""}`);
  }

  console.log("\n================ SESSION STRING (secret!) ================\n");
  console.log(client.session.save());
  console.log("\n==========================================================\n");
  console.log("Next (see DEPLOY_GUIDE.md, Phase 8):");
  console.log("  1. Copy the session string above into the GitHub secret TELEGRAM_SESSION.");
  console.log("  2. Add TELEGRAM_API_ID and TELEGRAM_API_HASH as GitHub secrets.");
  console.log("  3. Add TELEGRAM_CHANNELS: `all`, or a comma-separated list from above");
  console.log("     (usernames without @, or the numeric id for channels without one).");
  console.log("  4. Clear this terminal window afterwards.\n");

  rl.close();
  await client.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Telegram login failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
