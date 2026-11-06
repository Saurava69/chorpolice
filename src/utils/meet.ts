/**
 * Google Meet Integration Helper
 * Allows creating, formatting, sharing, and joining Google Meet calls for Chor Sipahi rooms.
 */

export function generateMeetSpaceCode(): string {
  // Typical Google Meet format: xxx-yyyy-zzz
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

export function formatMeetUrl(codeOrUrl: string): string {
  const trimmed = codeOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // If user entered xxx-yyyy-zzz or code
  return `https://meet.google.com/${trimmed}`;
}

export function openGoogleMeet(url: string) {
  const meetUrl = formatMeetUrl(url);
  window.open(meetUrl, '_blank', 'noopener,noreferrer');
}
