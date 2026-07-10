/**
 * vmsPrint.js — VMS Android Bluetooth Print Utility
 *
 * Prints EXACTLY what the API returns. Field names are mapped
 * directly from the backend response objects.
 *
 * IMAGE-BASED PRINTING:
 * When a visitor photo (avatar or photoUrl) is provided, it's encoded as
 * Base64 and transmitted alongside the JSON payload. The native Android
 * bridge (PrinterBridge.kt) will decode it and render it on the thermal
 * receipt using Canvas.
 *
 * ─── Visitor Pass ───────────────────────────────────────────────────────────
 * Source: POST /api/visitors → response.data
 *   response.data.visitor : { id, name, phone, type, photo }
 *   response.data.visit   : { id, visitorId, purpose, photo, vehicleNumber,
 *                              noofentry, checkIn, checkOut, status,
 *                              qrCode, displayId, createdAt,
 *                              visitorName, visitorPhone, visitorType, visitorPhoto,
 *                              company,                 ← Vendor
 *                              studentName, grade, section, relation  ← Student }
 *
 * ─── Gate Pass ─────────────────────────────────────────────────────────────
 * Source: POST /api/gatepass/student|faculty → response.data
 *   { id, studentName|facultyName, grade|department, section,
 *     pickupBy, relation, purpose, approvingAuthority,
 *     qrCode, displayId, exitPermittedById,
 *     exitPermittedByName, exitPermittedByRole,
 *     status, createdAt, updatedAt, type: 'STUDENT'|'FACULTY' }
 *
 * ─── Reprint (from Dashboard / VisitorLogs) ─────────────────────────────────
 * Source: normalizeVisitorData() → the adapted row stored in React state.
 *   { id, visitorId, name, type, contact, reason, vehicleNumber,
 *     studentName, grade, section, relation, company,
 *     noofentry, date, time, checkOutTime, avatar, initials }
 *
 * ─── Rules ─────────────────────────────────────────────────────────────────
 * 1. Call directly in the API success handler — NEVER inside useEffect.
 * 2. Await the 700ms delay AFTER calling trigger, BEFORE setState.
 *    Flow: API success → triggerPrint() → await delay(700ms) → setState
 */

import { isWindowsApp, sendPrintCommand } from './printBridge';

const PRINT_KEY_PREFIX = 'vms_printed_';

function getPrinterSize() {
  return localStorage.getItem('vms_printer_size') || '58mm';
}

// ─── Image Processing ─────────────────────────────────────────────────────────

/**
 * Convert an image URL or File URL to Base64 string.
 * Handles cross-origin images by fetching through a blob.
 *
 * @param {string} imageUrl - The image URL to encode
 * @returns {Promise<string|null>} Base64 string or null if conversion fails
 */
async function imageUrlToBase64(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) {
    return imageUrl.split(',')[1];
  }

  let targetUrl = imageUrl;
  if (targetUrl.startsWith('http://')) {
    targetUrl = targetUrl.replace('http://', 'https://');
    console.log(`[VMS Print] Enforced HTTPS for photo URL: ${targetUrl}`);
  }

  try {
    console.log(`[VMS Print] Converting image to Base64: ${targetUrl}`);

    // Fetch the image as a blob
    const response = await fetch(targetUrl);
    if (!response.ok) {
      console.warn(`[VMS Print] Failed to fetch image (HTTP ${response.status})`);
      return null;
    }

    const blob = await response.blob();

    // Convert blob to Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        console.log(`[VMS Print] Image encoded to Base64 (${base64.length} chars)`);
        resolve(base64);
      };
      reader.onerror = () => {
        console.warn('[VMS Print] FileReader error during Base64 encoding');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[VMS Print] Error converting image to Base64: ${err.message}`);
    return null;
  }
}

/**
 * Resolves the organization logo from localStorage and encodes it as Base64.
 * Appends logoUrl and logoBase64 to the printing payload.
 *
 * @param {object} payload - The printing payload to append the logo to
 */
async function addOrgLogoToPayload(payload) {
  try {
    const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
    let logoUrl = org?.logo;

    // Fallback if logo is missing
    if (!logoUrl) {
      logoUrl = '/assets/images/logo1.png';
    }

    // Resolve relative path to absolute URL
    const absoluteLogoUrl = new URL(logoUrl, window.location.origin).href;
    payload.logoUrl = absoluteLogoUrl;
    payload.orgName = org?.name || 'Visitor Management System';

    console.log(`[VMS Print] Attempting to load organization logo from: ${absoluteLogoUrl}`);
    const logoBase64 = await imageUrlToBase64(absoluteLogoUrl);
    if (logoBase64) {
      payload.logoBase64 = logoBase64;
      console.log(`[VMS Print] Logo successfully added to payload (${logoBase64.length} chars)`);
    } else {
      console.warn('[VMS Print] Could not convert logo to Base64');
    }
  } catch (err) {
    console.warn('[VMS Print] Error adding organization logo to payload:', err);
  }
}

// ─── Dedup Guard ──────────────────────────────────────────────────────────────

function isPrintedAlready(id) {
  return sessionStorage.getItem(PRINT_KEY_PREFIX + id) === '1';
}

// Exported so it can be cleared/manually set if needed, but normally internal
export function markPrinted(id) {
  sessionStorage.setItem(PRINT_KEY_PREFIX + id, '1');
}

// ─── Bridge Check ─────────────────────────────────────────────────────────────

function isAndroidBridgeAvailable(method) {
  const ok =
    typeof window.Android !== 'undefined' &&
    typeof window.Android[method] === 'function';
  if (!ok) {
    console.log(
      `[VMS Print] window.Android.${method} not available — ` +
      `running in browser or Android bridge not ready.`
    );
  }
  return ok;
}

// ─── Fast Browser Print (iframe isolation) ────────────────────────────────────

/**
 * Print a specific DOM element fast using an isolated iframe.
 * Much faster than window.print() because it avoids rendering the entire app.
 *
 * @param {string} elementId - The ID of the element to print
 * @param {string} [extraCss] - Optional extra CSS string to inject
 */
export function printElementFast(elementId, extraCss = '') {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[VMS Print] Element #${elementId} not found — falling back to window.print()`);
    window.print();
    return;
  }

  // Collect all existing stylesheets from the page
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => `<link rel="stylesheet" href="${l.href}">`)
    .join('\n');

  const styleBlocks = Array.from(document.querySelectorAll('style'))
    .map(s => `<style>${s.textContent}</style>`)
    .join('\n');

  const printerSize = getPrinterSize();
  const isLarge = printerSize === '75mm';
  const pageSizeCss = isLarge ? '3in auto' : '2.1in auto';
  const widthCss = isLarge ? '3in' : '2.1in';

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:3in;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${styleLinks}
        ${styleBlocks}
        <style>
          @page { size: ${pageSizeCss}; margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          #printable-badge {
            width: ${widthCss} !important;
            max-width: ${widthCss} !important;
            padding: 8px !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          ${extraCss}
        </style>
      </head>
      <body>${el.outerHTML}</body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();

  // Guard flag — ensures only ONE of (onload / setTimeout) triggers the print dialog
  let hasPrinted = false;

  const doPrint = () => {
    if (hasPrinted) return; // already triggered — skip to avoid double dialog
    hasPrinted = true;
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('[VMS Print] iframe print error:', e);
      window.print();
    }
    // Cleanup after print dialog closes
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 2000);
  };

  // Primary trigger: fire as soon as the iframe content is ready
  iframe.onload = doPrint;

  // Safety fallback: fire after 800ms in case onload doesn't fire
  setTimeout(doPrint, 800);
}


// ─── Visitor Pass ─────────────────────────────────────────────────────────────

function buildEscPosQrCommands(value) {
  if (!value) return '';

  const qrData = String(value);
  const length = qrData.length + 3;
  const pL = String.fromCharCode(length % 256);
  const pH = String.fromCharCode(Math.floor(length / 256));

  return [
    '\x1D(k\x04\x001A\x32\x00',
    '\x1D(k\x03\x001C\x08',
    '\x1D(k\x03\x001E\x30',
    `\x1D(k${pL}${pH}1P0${qrData}`,
    '\x1D(k\x03\x001Q0',
  ].join('');
}

function buildVisitorPassPayload(visitor, visit, localPhotoBase64 = null) {
  const photo = localPhotoBase64 || visitor.photo || visit.visitorPhoto || visit.photo || '';

  return {
    displayId: visit.displayId || '',
    visitId: String(visit.id) || '',
    visitorName: visitor.name || '',
    visitorPhone: visitor.phone || '',
    visitorType: visitor.type || '',
    purpose: visit.purpose || '',
    checkIn: visit.checkIn || visit.createdAt || '',
    status: visit.status || '',
    noofentry: visit.noofentry || 1,
    vehicleNumber: visit.vehicleNumber || '',
    studentName: visit.studentName || '',
    grade: visit.grade || '',
    section: visit.section || '',
    relation: visit.relation || '',
    company: visit.company || '',
    qrCode: visit.qrCode || visit.displayId || '',
    photo,
    initials: visitor.name ? visitor.name.charAt(0).toUpperCase() : 'V',
  };
}

function buildVisitorReprintPayload(v) {
  return {
    displayId: v.visitorId || String(v.id) || '',
    visitId: String(v.id) || '',
    visitorName: v.name || '',
    visitorPhone: v.contact || '',
    visitorType: v.type || '',
    purpose: v.reason || '',
    checkIn: v.time || '',
    status: v.checkOutTime ? 'OUT' : 'IN',
    noofentry: v.noofentry || 1,
    vehicleNumber: v.vehicleNumber !== '-' ? (v.vehicleNumber || '') : '',
    studentName: v.studentName !== '-' ? (v.studentName || '') : '',
    grade: v.grade !== '-' ? (v.grade || '') : '',
    section: v.section !== '-' ? (v.section || '') : '',
    relation: v.relation !== '-' ? (v.relation || '') : '',
    company: v.company !== '-' ? (v.company || '') : '',
    qrCode: v.visitorId || String(v.id) || '',
    photo: v.avatar || '',
    initials: v.initials || (v.name ? v.name.charAt(0).toUpperCase() : 'V'),
  };
}

/**
 * Trigger automatic Bluetooth printing of a Visitor Pass.
 *
 * Call DIRECTLY in handlePreparePass() after response.success,
 * BEFORE setSubmittedVisitor / setShowBadge.
 *
 * @param {object} visitor  - response.data.visitor   { id, name, phone, type, photo }
 * @param {object} visit    - response.data.visit     (full joined row from DB)
 */
export async function triggerVisitorPassPrint(visitor, visit, localPhotoBase64 = null) {
  // Use displayId as the dedup key (unique per visit)
  const id = visit.displayId || String(visit.id);
  console.log(`[VMS Print] triggerVisitorPassPrint called — displayId: ${id}`);

  if (!id) {
    console.warn('[VMS Print] No visit displayId found — skipping print');
    return;
  }

  if (isPrintedAlready(id)) {
    console.log(`[VMS Print] ${id} already printed this session — skipping duplicate`);
    return;
  }

  if (!isAndroidBridgeAvailable('printVisitorPass')) return;

  // ── Build payload from EXACT API response fields ──────────────────────────
  const payload = buildVisitorPassPayload(visitor, visit, localPhotoBase64);
  payload.printerSize = getPrinterSize();

  // ── Handle organization logo ──────────────────────────────────────────────
  await addOrgLogoToPayload(payload);

  // ── Handle visitor photo ───────────────────────────────────────────────────
  // Try to encode photo from multiple sources
  if (localPhotoBase64) {
    if (localPhotoBase64.startsWith('data:')) {
      payload.photoBase64 = localPhotoBase64.split(',')[1];
    } else {
      payload.photoBase64 = localPhotoBase64;
    }
    console.log('[VMS Print] Local in-memory photo added to payload (bypassed fetch)');
  } else {
    const photoUrl = visitor.photo || visit.visitorPhoto || visit.photo;
    if (photoUrl) {
      console.log('[VMS Print] Attempting to load visitor photo...');
      const photoBase64 = await imageUrlToBase64(photoUrl);
      if (photoBase64) {
        payload.photoBase64 = photoBase64;
        console.log('[VMS Print] Photo added to payload');
      }
    }
  }

  console.log('[VMS Print] Visitor Pass payload:', payload);

  try {
    markPrinted(id); // Mark BEFORE bridge call to prevent race
    window.Android.printVisitorPass(JSON.stringify(payload));
    console.log(`[VMS Print] printVisitorPass dispatched for ${id}`);
  } catch (err) {
    console.error('[VMS Print] Error calling window.Android.printVisitorPass:', err);
  }
}

function buildGatePassPayload(pass) {
  const isFaculty = pass.isFaculty || pass.type === 'FACULTY';

  return {
    displayId: pass.displayId || String(pass.id) || '',
    passId: String(pass.id) || '',
    passType: isFaculty ? 'FACULTY' : 'STUDENT',
    studentName: pass.studentName || '',
    grade: pass.grade || '',
    section: pass.section || '',
    busRoute: pass.busRoute || pass.bus_route || pass.busNumber || '',
    pickupBy: pass.pickupBy || '',
    relation: pass.relation || '',
    facultyName: pass.facultyName || '',
    department: pass.department || '',
    purpose: pass.purpose || '',
    approvingAuthority: pass.approvingAuthority || pass.authority || '',
    exitPermittedByName: pass.exitPermittedByName || '',
    exitPermittedByRole: pass.exitPermittedByRole || '',
    status: pass.status || 'Approved',
    createdAt: pass.createdAt || '',
    date: pass.date || '',
    time: pass.time || '',
    expectedReturnTime: pass.expectedReturnTime || '',
    exitPermittedBy: pass.exitPermittedBy || '',
    qrCode: pass.qrCode || pass.displayId || String(pass.id) || '',
  };
}

function formatDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function buildHeaderCommands(logoUrl, printerSize = '58mm') {
  let dataUrl = "";
  try {
    console.log(`[VMS Print] buildHeaderCommands fetching: ${logoUrl}`);
    const response = await fetch(logoUrl);
    if (response.ok) {
      const blob = await response.blob();
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn(`[VMS Print] buildHeaderCommands fetch failed for: ${logoUrl}`, err);
  }

  // Fallback to default logo if custom logo fetch failed
  const fallbackAbsoluteUrl = new URL('/assets/images/logo1.png', window.location.origin).href;
  if (!dataUrl && logoUrl !== fallbackAbsoluteUrl) {
    try {
      console.log(`[VMS Print] buildHeaderCommands falling back to default logo: ${fallbackAbsoluteUrl}`);
      const response = await fetch(fallbackAbsoluteUrl);
      if (response.ok) {
        const blob = await response.blob();
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      console.warn('[VMS Print] buildHeaderCommands fallback fetch failed:', err);
    }
  }

  if (!dataUrl) {
    console.warn('[VMS Print] buildHeaderCommands: No valid logo data URL obtained.');
    return "";
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const isLarge = printerSize === '75mm';
      const CANVAS_WIDTH = isLarge ? 576 : 384; // px — standard 75mm/58mm width
      const LOGO_MAX_HEIGHT = isLarge ? 80 : 60;

      // Calculate logo dimensions maintaining aspect ratio (max height 60, max width 384)
      const scale = Math.min(CANVAS_WIDTH / img.width, LOGO_MAX_HEIGHT / img.height, 1);
      const logoW = Math.ceil((img.width * scale) / 8) * 8; // multiple of 8
      const logoH = Math.floor(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = logoH;
      const ctx = canvas.getContext('2d');

      // Clear to white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, logoH);

      // Draw Logo centered horizontally
      const logoX = Math.max(0, Math.floor((CANVAS_WIDTH - logoW) / 2));
      ctx.drawImage(img, logoX, 0, logoW, logoH);

      // Rasterize the canvas
      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, logoH);
      const pixels = imageData.data;
      const bytesPerRow = CANVAS_WIDTH / 8;
      const rasterBytes = [];

      for (let y = 0; y < logoH; y++) {
        for (let byteX = 0; byteX < bytesPerRow; byteX++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = byteX * 8 + bit;
            const idx = (y * CANVAS_WIDTH + x) * 4;
            const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance < 150) byte |= (0x80 >> bit); // dark pixel = printed dot
          }
          rasterBytes.push(byte);
        }
      }

      // ESC/POS GS v 0 — raster bit image command
      const xL = bytesPerRow % 256;
      const xH = Math.floor(bytesPerRow / 256);
      const yL = logoH % 256;
      const yH = Math.floor(logoH / 256);

      const header =
        '\x1D' + 'v' + '0' + '\x00' +
        String.fromCharCode(xL) +
        String.fromCharCode(xH) +
        String.fromCharCode(yL) +
        String.fromCharCode(yH);

      const bitmap = rasterBytes.map(b => String.fromCharCode(b)).join('');
      resolve(header + bitmap);
    };

    img.onerror = (err) => {
      console.warn('[VMS Print] buildHeaderCommands: Image load error from data URL', err);
      resolve("");
    };

    img.src = dataUrl;
  });
}

function formatRow(label, value, lineWidth = 32) {
  if (!value) return '';
  const padLen = lineWidth === 48 ? 16 : 12;
  const paddedLabel = label.padEnd(padLen, ' ');
  return paddedLabel + ': ' + value;
}

function extractDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function extractTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

async function buildWindowsGatePassCommands(pass) {
  const payload = buildGatePassPayload(pass);
  const isFaculty = payload.passType === 'FACULTY';

  const esc = '\x1B';
  const gs = '\x1D';

  const printerSize = getPrinterSize();
  const isLarge = printerSize === '75mm';

  const LINE_WIDTH = isLarge ? 48 : 32;
  const DASH_SEP = '- '.repeat(LINE_WIDTH / 2);      // dashed

  // Get logo and org details
  let orgName = '';
  let logoUrl = '';
  try {
    const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
    orgName = org?.name || 'Visitor Management System';
    logoUrl = org?.logo;
  } catch (err) {
    console.warn('[VMS Print] Error reading organization logo:', err);
    orgName = 'Visitor Management System';
  }
  if (!logoUrl) {
    logoUrl = '/assets/images/logo1.png';
  }

  const absoluteLogoUrl = new URL(logoUrl, window.location.origin).href;

  let headerImage = "";
  try {
    headerImage = await buildHeaderCommands(absoluteLogoUrl, printerSize);
  } catch (err) {
    console.warn('[VMS Print] Logo fetch failed:', err);
  }

  // Construct permitted line
  const permitLine = payload.exitPermittedByName || payload.exitPermittedBy || 'Admin';

  // Build rows using formatRow (Date and Time removed — now in header)
  const rows = [];
  if (isFaculty) {
    rows.push(formatRow('Faculty', payload.facultyName, LINE_WIDTH));
    rows.push(formatRow('Department', payload.department, LINE_WIDTH));
    rows.push(formatRow('Authority', payload.approvingAuthority, LINE_WIDTH));
    rows.push(formatRow('Exp Return', payload.expectedReturnTime || '-', LINE_WIDTH));
    rows.push(formatRow('Purpose', payload.purpose, LINE_WIDTH));
    rows.push(formatRow('Permitted By', permitLine, LINE_WIDTH));
  } else {
    const grade = payload.grade || '';
    const section = payload.section || '';
    const gradeSec = (grade + ' ' + section).trim();

    rows.push(formatRow('Student', payload.studentName, LINE_WIDTH));
    rows.push(formatRow('Grade/Sec', gradeSec, LINE_WIDTH));
    rows.push(formatRow('Bus Route', payload.busRoute, LINE_WIDTH));
    rows.push(formatRow('Pickup By', payload.pickupBy, LINE_WIDTH));
    rows.push(formatRow('Relation', payload.relation, LINE_WIDTH));
    rows.push(formatRow('Authority', payload.approvingAuthority, LINE_WIDTH));
    rows.push(formatRow('Purpose', payload.purpose, LINE_WIDTH));
    rows.push(formatRow('Permitted By', permitLine, LINE_WIDTH));
  }

  const body = rows.filter(Boolean).join('\n');
  // Single double-height line: GATE PASS (left) | date + time (right) — all same height
  const dateStr = extractDate(payload.createdAt);
  const timeStr = extractTime(payload.createdAt);
  const LEFT_WIDTH = isLarge ? 12 : 10;                           // "GATE PASS" = 9 + space
  const RIGHT_WIDTH = LINE_WIDTH - LEFT_WIDTH;     // chars for date+time
  const dateTimeStr = `${dateStr} ${timeStr}`;     // e.g. "23 Jun 2026 12:14 PM"
  const headerLine = 'GATE PASS'.padEnd(LEFT_WIDTH) + dateTimeStr.padStart(RIGHT_WIDTH);

  // Build ESC/POS command array
  const parts = [];
  parts.push(`${esc}@`);               // Initialize printer
  parts.push(`${esc}a\x01`);           // Center align

  // Org name — double height + bold, centered
  parts.push(`${esc}!\x10`);           // Double height + bold ON
  parts.push(orgName + '\n');
  parts.push(`${esc}!\x00`);           // Reset
  parts.push(`${esc}a\x00`);           // Left align
  parts.push(DASH_SEP + '\n');         // Separator line below org name

  // GATE PASS + date + time — one line, double height + bold
  parts.push(`${esc}!\x10`);           // Double height + bold ON
  parts.push(headerLine + '\n');
  parts.push(`${esc}!\x00`);           // Reset

  parts.push(DASH_SEP + '\n');

  parts.push(`${esc}a\x00`);           // Left align for fields
  parts.push(body + '\n');

  parts.push(DASH_SEP + '\n');

  parts.push(`${esc}a\x01`);           // Center align for QR
  parts.push(buildEscPosQrCommands(payload.qrCode)); // QR bitmap commands (no \n)
  parts.push(`${esc}a\x00`);           // Left align reset immediately, no \n

  parts.push(DASH_SEP + '\n');

  parts.push(`${esc}a\x01`);           // Center align for footer
  // Feed \n\n\n\n to physically push "Thank you" past the cutter
  // (cutter sits ~15–20mm above print head; without feed the text prints on next slip)
  parts.push('Thank you - Visit Again');

  // Partial cut with feed — most reliable across thermal printer models
  parts.push(`${gs}V\x41\x00`);        // Partial cut

  return parts.join('');
}

// ─── Gate Pass ────────────────────────────────────────────────────────────────

/**
 * Trigger automatic Bluetooth printing of a Gate Pass on creation.
 * Called directly after the API success response, before setState.
 *
 * @param {object} pass - The newly created gatepass from the API response
 */
export async function triggerGatePassPrint(pass) {
  const id = pass.displayId || String(pass.id);
  console.log(`[VMS Print] triggerGatePassPrint called — displayId: ${id}, type: ${pass.type}`);

  if (!id) {
    console.warn('[VMS Print] No pass displayId found — skipping print');
    return;
  }

  if (isPrintedAlready(id)) {
    console.log(`[VMS Print] ${id} already printed this session — skipping duplicate`);
    return;
  }

  if (isWindowsApp()) {
    const printData = await buildWindowsGatePassCommands(pass);
    if (sendPrintCommand('PRINT_GATE_PASS', printData)) {
      markPrinted(id);
      console.log(`[VMS Print] Windows PRINT_GATE_PASS dispatched for ${id}`);
      return;
    }
  }

  if (!isAndroidBridgeAvailable('printGatePass')) {
    // Browser (no Android bridge): do NOT auto-print here.
    // The user will manually click "Print Pass" which calls reprintGatePass().
    // Auto-printing here would cause a double-print dialog.
    console.log('[VMS Print] No Android bridge — skipping auto-print. User can click Print Pass to print manually.');
    return;
  }



  // ── Build payload from EXACT API response fields ──────────────────────────
  const payload = buildGatePassPayload(pass);

  console.log('[VMS Print] Gate Pass payload:', payload);

  try {
    markPrinted(id); // Mark BEFORE bridge call to prevent race
    window.Android.printGatePass(JSON.stringify(payload));
    console.log(`[VMS Print] printGatePass dispatched for ${id}`);
  } catch (err) {
    console.error('[VMS Print] Error calling window.Android.printGatePass:', err);
  }
}

// ─── Visitor Pass Reprint (from Dashboard / VisitorLogs) ──────────────────────

/**
 * Reprint a Visitor Pass from an already-normalized visitor row.
 *
 * Use this when the user clicks "Reprint Badge" in Dashboard or VisitorLogs —
 * where we only have the UI-adapted visitor object, not the raw API response.
 *
 * On Android (printer wrapper): sends to Bluetooth thermal printer.
 * In browser: falls back to fast iframe print so the on-screen badge is printed.
 *
 * Unlike triggerVisitorPassPrint, there is NO dedup guard here —
 * the user explicitly wants to reprint so we always honour the request.
 *
 * @param {object} v - Normalized visitor row:
 *   { id, visitorId, name, type, contact, reason, vehicleNumber,
 *     studentName, grade, section, relation, company,
 *     noofentry, date, time, checkOutTime, avatar, initials }
 */
export async function reprintVisitorPass(v) {
  const id = v.visitorId || String(v.id);
  console.log(`[VMS Print] reprintVisitorPass called — id: ${id}, type: ${v.type}`);

  if (!isAndroidBridgeAvailable('printVisitorPass')) {
    // Browser fallback — print the on-screen badge via fast iframe
    console.log('[VMS Print] No Android bridge — using fast browser print');
    printElementFast('printable-visitor-badge');
    return;
  }

  // ── Map normalized UI fields → BluetoothPrinterManager payload ──────────
  const payload = buildVisitorReprintPayload(v);
  payload.printerSize = getPrinterSize();

  // ── Handle organization logo ──────────────────────────────────────────────
  await addOrgLogoToPayload(payload);

  // ── Handle visitor avatar ──────────────────────────────────────────────────
  // The avatar is already displayed on the dashboard; encode and send it
  if (v.avatar) {
    console.log('[VMS Print] Attempting to load visitor avatar...');
    const photoBase64 = await imageUrlToBase64(v.avatar);
    if (photoBase64) {
      payload.photoBase64 = photoBase64;
      console.log('[VMS Print] Avatar added to payload');
    }
  }

  console.log('[VMS Print] Reprint Visitor Pass payload:', payload);

  try {
    window.Android.printVisitorPass(JSON.stringify(payload));
    console.log(`[VMS Print] reprintVisitorPass dispatched for ${id}`);
  } catch (err) {
    console.error('[VMS Print] Error calling window.Android.printVisitorPass (reprint):', err);
    // Last-resort browser fallback
    printElementFast('printable-badge');
  }
}

// ─── Gate Pass Reprint (from StudentGatepass view modal) ──────────────────────

/**
 * Reprint a Gatepass from the view modal.
 *
 * On Android: sends JSON to Bluetooth printer via window.Android.printGatePass.
 * In browser: uses fast iframe print of #printable-badge element.
 *
 * No dedup guard — user explicitly initiated the reprint.
 *
 * @param {object} pass - Adapted gatepass row from React state
 */
export async function reprintGatePass(pass) {
  const id = pass.displayId || String(pass.id);
  console.log(`[VMS Print] reprintGatePass called — id: ${id}, isFaculty: ${pass.isFaculty}`);

  if (isWindowsApp()) {
    const printData = await buildWindowsGatePassCommands(pass);
    if (sendPrintCommand('PRINT_GATE_PASS', printData)) {
      console.log(`[VMS Print] Windows PRINT_GATE_PASS reprint dispatched for ${id}`);
      return;
    }
  }

  if (!isAndroidBridgeAvailable('printGatePass')) {
    // Browser fallback — fast iframe print of badge element
    console.log('[VMS Print] No Android bridge — using fast browser print');
    printElementFast('printable-badge');
    return;
  }

  // ── Map pass fields → BluetoothPrinterManager payload ───────────────────
  const payload = buildGatePassPayload(pass);

  console.log('[VMS Print] Reprint Gate Pass payload:', payload);

  try {
    window.Android.printGatePass(JSON.stringify(payload));
    console.log(`[VMS Print] reprintGatePass dispatched for ${id}`);
  } catch (err) {
    console.error('[VMS Print] Error calling window.Android.printGatePass (reprint):', err);
    printElementFast('printable-badge');
  }
}
