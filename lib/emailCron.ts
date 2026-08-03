import { triggerAllAutomatedEmails } from '@/utils/emailService';

let isCronRunning = false;
let lastCronRunTime: string | null = null;
let cronTimer: NodeJS.Timeout | null = null;

export function initAutomatedEmailCron() {
  if (isCronRunning) return;
  isCronRunning = true;

  console.log('[AUTOMATED EMAIL CRON] Initializing background email scheduler service...');

  // Run initial automated scan and dispatch after 10 seconds of server startup
  setTimeout(() => {
    runAutomatedEmailScan();
  }, 10000);

  // Repeat background scan automatically every 12 hours (43,200,000 ms)
  cronTimer = setInterval(() => {
    runAutomatedEmailScan();
  }, 12 * 60 * 60 * 1000);
}

export async function runAutomatedEmailScan() {
  try {
    const nowStr = new Date().toLocaleString('id-ID');
    console.log(`[AUTOMATED EMAIL CRON] Starting scheduled email scan at ${nowStr}...`);

    const result = await triggerAllAutomatedEmails();
    lastCronRunTime = new Date().toLocaleString('id-ID');

    console.log(
      `[AUTOMATED EMAIL CRON SUCCESS] Processed ${result.totalSent} member email reminders at ${lastCronRunTime}.`
    );
    return {
      success: true,
      lastRun: lastCronRunTime,
      totalSent: result.totalSent,
    };
  } catch (err) {
    console.error('[AUTOMATED EMAIL CRON ERROR]:', err);
    return {
      success: false,
      error: String(err),
    };
  }
}

export function getCronStatus() {
  return {
    isActive: isCronRunning,
    lastRun: lastCronRunTime || 'Sudah Berjalan Realtime',
  };
}
