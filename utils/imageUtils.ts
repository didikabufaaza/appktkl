/**
 * Converts Google Drive share links to direct embeddable image URLs
 * or generates a high quality avatar SVG placeholder based on member name.
 */
export function getMemberPhotoUrl(photoLink?: string, name?: string): string {
  if (!photoLink || photoLink.trim() === '') {
    const safeName = encodeURIComponent(name || 'Member');
    return `https://ui-avatars.com/api/?name=${safeName}&background=0f172a text=10b981&color=10b981&bold=true&size=200`;
  }

  const link = photoLink.trim();

  // If base64 data URL
  if (link.startsWith('data:')) {
    return link;
  }

  // If already a direct image URL or QR URL
  if (link.startsWith('http') && !link.includes('drive.google.com')) {
    return link;
  }

  // Extract Google Drive File ID
  let fileId = '';

  if (link.includes('id=')) {
    const match = link.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  } else if (link.includes('/file/d/')) {
    const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return link;
}

/**
 * Generates a public QR Code image URL for a member
 */
export function getMemberQrUrl(qrLink?: string, memberNumber?: string, name?: string, profesi?: string): string {
  if (qrLink && qrLink.startsWith('http')) {
    return qrLink;
  }

  const qrData = encodeURIComponent(
    `${name || 'Anggota KTKL'}-${memberNumber || '000/KTKL/2026'}-${profesi || 'NAKES'}-TERVERIFIKASI-RSUD-OKU-TIMUR`
  );

  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
}
