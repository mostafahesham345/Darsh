import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'public', 'images', 'Logo.png');

const NAVY = '#0a1f44';
const YELLOW = '#f7e27e';
const GOLD = '#d4af37';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const INK = '#0a1f44';

const MARGIN = 48;

function brand() {
  return {
    name: process.env.BUSINESS_NAME || 'Darsh Tech',
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  };
}

function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/* --------------------------- Layout primitives --------------------------- */

function contentWidth(doc) {
  return doc.page.width - MARGIN * 2;
}

function resetX(doc) {
  doc.x = MARGIN;
}

function drawHeader(doc, subtitle) {
  const b = brand();
  doc.save();
  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);
  if (fs.existsSync(LOGO_PATH)) {
    try { doc.image(LOGO_PATH, MARGIN, 32, { height: 46 }); } catch {}
  }
  doc.fillColor(YELLOW).font('Helvetica-Bold').fontSize(22)
    .text(b.name, MARGIN + 60, 38, { lineBreak: false });
  if (subtitle) {
    doc.fillColor('#ffffff').font('Helvetica').fontSize(11)
      .text(subtitle, MARGIN + 60, 68, { lineBreak: false });
  }
  if (b.email) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(10)
      .text(b.email, MARGIN, 46, { align: 'right', width: doc.page.width - MARGIN * 2, lineBreak: false });
  }
  doc.restore();
  doc.y = 140;
  resetX(doc);
}

function drawFooter(doc) {
  const b = brand();
  const bottom = doc.page.height - 36;
  const origBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.save();
  doc.strokeColor(LINE).lineWidth(0.5)
    .moveTo(MARGIN, bottom - 14).lineTo(doc.page.width - MARGIN, bottom - 14).stroke();
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`${b.name}${b.email ? ' · ' + b.email : ''}`, MARGIN, bottom - 8, {
      width: contentWidth(doc), align: 'center', lineBreak: false,
    });
  doc.restore();
  doc.page.margins.bottom = origBottomMargin;
}

function ensureSpace(doc, needed) {
  const bottomLimit = doc.page.height - 70;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
    doc.y = MARGIN;
    resetX(doc);
  }
}

function sectionTitle(doc, label) {
  ensureSpace(doc, 40);
  doc.moveDown(0.8);
  resetX(doc);
  const y = doc.y;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
    .text(label.toUpperCase(), MARGIN, y, {
      characterSpacing: 1.4, width: contentWidth(doc), lineBreak: false,
    });
  const underlineY = doc.y + 3;
  doc.moveTo(MARGIN, underlineY).lineTo(doc.page.width - MARGIN, underlineY)
    .strokeColor(GOLD).lineWidth(1).stroke();
  doc.y = underlineY + 10;
  resetX(doc);
  doc.fillColor(INK).font('Helvetica').fontSize(11);
}

function kvRow(doc, k, v) {
  ensureSpace(doc, 22);
  const top = doc.y;
  const labelW = 130;
  const valueX = MARGIN + labelW + 10;
  const valueW = doc.page.width - MARGIN - valueX;

  doc.font('Helvetica-Bold').fillColor(MUTED).fontSize(9)
    .text(k.toUpperCase(), MARGIN, top + 2, {
      width: labelW, characterSpacing: 0.7, lineBreak: false,
    });
  const yAfterLabel = doc.y;

  doc.font('Helvetica').fillColor(INK).fontSize(11)
    .text(v || '—', valueX, top, { width: valueW });
  const yAfterValue = doc.y;

  doc.y = Math.max(yAfterLabel, yAfterValue) + 6;
  resetX(doc);
}

function paragraph(doc, text, { size = 10.5, color = INK, font = 'Helvetica' } = {}) {
  if (!text) return;
  ensureSpace(doc, 30);
  resetX(doc);
  doc.font(font).fillColor(color).fontSize(size)
    .text(text, MARGIN, doc.y, { width: contentWidth(doc), align: 'justify', lineGap: 3 });
  doc.y += 8;
  resetX(doc);
}

function bulletList(doc, text) {
  const items = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!items.length) {
    doc.font('Helvetica-Oblique').fillColor(MUTED).fontSize(11)
      .text('—', MARGIN, doc.y, { width: contentWidth(doc) });
    doc.y += 4;
    resetX(doc);
    return;
  }
  items.forEach((line) => {
    ensureSpace(doc, 20);
    const y = doc.y;
    doc.font('Helvetica').fillColor(INK).fontSize(11)
      .text('•', MARGIN + 4, y, { width: 10, lineBreak: false });
    doc.text(line, MARGIN + 18, y, { width: contentWidth(doc) - 18 });
    doc.y += 3;
    resetX(doc);
  });
}

/* ---------------------------------------------------------------------------
   CONTRACT PDF
   --------------------------------------------------------------------------- */
export async function generateContractPdf(data) {
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, bufferPages: true });
  const out = streamToBuffer(doc);

  drawHeader(doc, 'Service Agreement');

  resetX(doc);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(26)
    .text(data.title || 'Service Agreement', MARGIN, doc.y, {
      width: contentWidth(doc), lineBreak: false,
    });
  doc.y += 2;
  doc.fillColor(MUTED).font('Helvetica').fontSize(10)
    .text(
      `Contract #${data.contractNumber || '—'}  ·  Dated ${data.effectiveDate || formatDate()}`,
      MARGIN, doc.y, { width: contentWidth(doc), lineBreak: false }
    );
  doc.y += 10;
  resetX(doc);

  // Status badge
  const isSigned = data.status === 'signed';
  const badgeLabel = isSigned ? 'FULLY SIGNED' : 'AWAITING CLIENT SIGNATURE';
  const badgeColor = isSigned ? '#10b981' : '#b45309';
  const badgeBg = isSigned ? '#ecfdf5' : '#fffbeb';
  const badgeW = doc.widthOfString(badgeLabel, { characterSpacing: 0.8 }) + 22;
  doc.save();
  doc.roundedRect(MARGIN, doc.y, badgeW, 20, 10).fill(badgeBg);
  doc.fillColor(badgeColor).font('Helvetica-Bold').fontSize(9)
    .text(badgeLabel, MARGIN + 11, doc.y + 6, { characterSpacing: 0.8, lineBreak: false });
  doc.restore();
  doc.y += 30;
  resetX(doc);

  sectionTitle(doc, 'Parties');
  kvRow(doc, 'Service Provider', `${brand().name}${brand().email ? ' (' + brand().email + ')' : ''}`);
  kvRow(doc, 'Client', data.clientName || '—');
  if (data.clientCompany) kvRow(doc, 'Company', data.clientCompany);
  if (data.clientEmail) kvRow(doc, 'Client Email', data.clientEmail);
  if (data.clientAddress) kvRow(doc, 'Client Address', data.clientAddress);

  sectionTitle(doc, 'Project Overview');
  paragraph(doc, data.projectDescription || 'Project description to be provided.');

  sectionTitle(doc, 'Scope of Work');
  bulletList(doc, data.scope);

  sectionTitle(doc, 'Deliverables');
  bulletList(doc, data.deliverables);

  sectionTitle(doc, 'Timeline');
  kvRow(doc, 'Start Date', data.startDate || 'Upon execution');
  kvRow(doc, 'End / Delivery Date', data.endDate || 'Per schedule');
  if (data.milestones) {
    doc.y += 4;
    doc.font('Helvetica-Bold').fillColor(MUTED).fontSize(9)
      .text('MILESTONES', MARGIN, doc.y, { characterSpacing: 0.7, lineBreak: false });
    doc.y += 14;
    resetX(doc);
    bulletList(doc, data.milestones);
  }

  sectionTitle(doc, 'Compensation');
  const feeText = data.totalFee
    ? `${data.currency || 'USD'} ${Number(data.totalFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : '—';
  kvRow(doc, 'Total Fee', feeText);
  if (data.paymentTerms) kvRow(doc, 'Payment Terms', data.paymentTerms);
  if (data.paymentSchedule) {
    doc.y += 4;
    doc.font('Helvetica-Bold').fillColor(MUTED).fontSize(9)
      .text('PAYMENT SCHEDULE', MARGIN, doc.y, { characterSpacing: 0.7, lineBreak: false });
    doc.y += 14;
    resetX(doc);
    bulletList(doc, data.paymentSchedule);
  }

  sectionTitle(doc, 'Intellectual Property');
  paragraph(doc, data.ipClause ||
    'Upon full payment of all fees due under this Agreement, the Service Provider transfers ownership of all deliverables to the Client, except for pre-existing tools, libraries, and frameworks which remain the property of the Service Provider and are licensed to the Client for use within the deliverables.');

  sectionTitle(doc, 'Confidentiality');
  paragraph(doc, data.confidentialityClause ||
    'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement and will not disclose such information to any third party without prior written consent.');

  sectionTitle(doc, 'Termination');
  paragraph(doc, data.terminationClause ||
    'Either party may terminate this Agreement with fourteen (14) days written notice. The Client shall pay for all work performed up to the termination date.');

  if (data.additionalTerms) {
    sectionTitle(doc, 'Additional Terms');
    paragraph(doc, data.additionalTerms);
  }

  ensureSpace(doc, 170);
  sectionTitle(doc, 'Signatures');
  doc.y += 18;

  const colW = (contentWidth(doc) - 40) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 40;
  const signedDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return ''; }
  };

  // Signature names (oblique to read like a hand signature) sit just above the rule.
  const nameY = doc.y;
  doc.fillColor(NAVY).font('Helvetica-Oblique').fontSize(20)
    .text(data.providerSignature || brand().name, leftX, nameY, { width: colW, lineBreak: false });
  if (isSigned && data.clientSignature) {
    doc.fillColor(NAVY).font('Helvetica-Oblique').fontSize(20)
      .text(data.clientSignature, rightX, nameY, { width: colW, lineBreak: false });
  } else {
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(11)
      .text('Awaiting signature', rightX, nameY + 8, { width: colW, lineBreak: false });
  }

  const ruleY = nameY + 30;
  doc.strokeColor(INK).lineWidth(0.6)
    .moveTo(leftX, ruleY).lineTo(leftX + colW, ruleY).stroke()
    .moveTo(rightX, ruleY).lineTo(rightX + colW, ruleY).stroke();

  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text('SERVICE PROVIDER', leftX, ruleY + 7, { width: colW, characterSpacing: 0.7, lineBreak: false })
    .text('CLIENT', rightX, ruleY + 7, { width: colW, characterSpacing: 0.7, lineBreak: false });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
    .text(data.providerSignature || brand().name, leftX, ruleY + 20, { width: colW, lineBreak: false })
    .text(data.clientName || '', rightX, ruleY + 20, { width: colW, lineBreak: false });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`Date: ${signedDate(data.providerSignedAt) || '_______________'}`, leftX, ruleY + 38, { width: colW, lineBreak: false })
    .text(`Date: ${isSigned ? (signedDate(data.clientSignedAt) || '') : '_______________'}`, rightX, ruleY + 38, { width: colW, lineBreak: false });

  if (isSigned) {
    doc.y = ruleY + 58;
    resetX(doc);
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(8.5)
      .text('This document was signed electronically by both parties. Typed names constitute legally binding signatures under applicable e-signature law.',
        MARGIN, doc.y, { width: contentWidth(doc), align: 'center', lineGap: 1 });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc);
    const origBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
      .text(`Page ${i - range.start + 1} of ${range.count}`,
        MARGIN, doc.page.height - 28,
        { width: contentWidth(doc), align: 'right', lineBreak: false });
    doc.page.margins.bottom = origBottomMargin;
  }

  doc.end();
  return await out;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------------------------------------------------------------------------
   INVOICE PDF
   --------------------------------------------------------------------------- */
export async function generateInvoicePdf(invoice, { markPaid = false } = {}) {
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, bufferPages: true });
  const out = streamToBuffer(doc);

  drawHeader(doc, markPaid ? 'Payment Receipt' : 'Invoice');

  // Big title + meta on the left, Billed-To card on the right
  const topY = 140;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(34)
    .text(markPaid ? 'RECEIPT' : 'INVOICE', MARGIN, topY, { lineBreak: false });
  doc.fillColor(MUTED).font('Helvetica').fontSize(10)
    .text(`${markPaid ? 'Receipt' : 'Invoice'} #${invoice.invoiceNumber}`, MARGIN, topY + 42, { lineBreak: false })
    .text(`Issued ${invoice.issueDate || formatDate()}`, MARGIN, topY + 58, { lineBreak: false });
  if (!markPaid && invoice.dueDate) {
    doc.text(`Due ${invoice.dueDate}`, MARGIN, topY + 72, { lineBreak: false });
  }
  if (markPaid && invoice.paidDate) {
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(12)
      .text(`PAID · ${invoice.paidDate}`, MARGIN, topY + 72, { lineBreak: false });
  }

  const rightX = doc.page.width - MARGIN - 230;
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
    .text('BILLED TO', rightX, topY, { characterSpacing: 1, width: 230, lineBreak: false });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12)
    .text(invoice.clientName || '—', rightX, topY + 14, { width: 230 });
  let ry = doc.y;
  doc.font('Helvetica').fontSize(10).fillColor(INK);
  if (invoice.clientCompany) { doc.text(invoice.clientCompany, rightX, ry, { width: 230 }); ry = doc.y; }
  if (invoice.clientEmail) { doc.text(invoice.clientEmail, rightX, ry, { width: 230 }); ry = doc.y; }
  if (invoice.clientAddress) { doc.text(invoice.clientAddress, rightX, ry, { width: 230 }); ry = doc.y; }

  doc.y = Math.max(topY + 100, ry + 20);
  resetX(doc);

  // Items table
  const colDesc = MARGIN + 8;
  const colQty = MARGIN + 320;
  const colRate = MARGIN + 380;
  const colAmount = doc.page.width - MARGIN - 90;
  const tableHeaderY = doc.y;
  doc.save();
  doc.rect(MARGIN, tableHeaderY, contentWidth(doc), 26).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
  doc.text('DESCRIPTION', colDesc, tableHeaderY + 9, { characterSpacing: 0.6, lineBreak: false });
  doc.text('QTY', colQty, tableHeaderY + 9, { width: 50, align: 'right', characterSpacing: 0.6, lineBreak: false });
  doc.text('RATE', colRate, tableHeaderY + 9, { width: 80, align: 'right', characterSpacing: 0.6, lineBreak: false });
  doc.text('AMOUNT', colAmount, tableHeaderY + 9, { width: 82, align: 'right', characterSpacing: 0.6, lineBreak: false });
  doc.restore();

  let y = tableHeaderY + 32;
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const currency = invoice.currency || 'USD';

  items.forEach((it, idx) => {
    const qty = Number(it.qty) || 1;
    const rate = Number(it.rate) || 0;
    const amt = qty * rate;
    const rowHeight = 28;
    if (y + rowHeight > doc.page.height - 200) {
      doc.addPage();
      y = MARGIN;
    }
    if (idx % 2 === 1) {
      doc.save();
      doc.rect(MARGIN, y - 6, contentWidth(doc), rowHeight).fill('#fafbff').restore();
    }
    doc.fillColor(INK).font('Helvetica').fontSize(11);
    doc.text(it.description || '', colDesc, y, { width: 280 });
    doc.text(String(qty), colQty, y, { width: 50, align: 'right', lineBreak: false });
    doc.text(rate.toFixed(2), colRate, y, { width: 80, align: 'right', lineBreak: false });
    doc.font('Helvetica-Bold')
      .text(amt.toFixed(2), colAmount, y, { width: 82, align: 'right', lineBreak: false });
    y += rowHeight;
  });

  doc.strokeColor(LINE).lineWidth(0.5).moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).stroke();
  y += 12;

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.rate) || 0), 0);
  const taxRate = Number(invoice.taxRate) || 0;
  const tax = subtotal * (taxRate / 100);
  const discount = Number(invoice.discount) || 0;
  const total = Math.max(0, subtotal + tax - discount);

  const totalsLabelX = doc.page.width - MARGIN - 230;
  const totalsValueX = doc.page.width - MARGIN - 90;
  const writeTotal = (label, val, bold = false) => {
    doc.fillColor(bold ? NAVY : MUTED)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 12 : 11)
      .text(label, totalsLabelX, y, { width: 140, align: 'right', lineBreak: false });
    doc.fillColor(INK).font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(`${currency} ${val.toFixed(2)}`, totalsValueX, y, { width: 82, align: 'right', lineBreak: false });
    y += bold ? 22 : 18;
  };
  writeTotal('Subtotal', subtotal);
  if (discount > 0) writeTotal('Discount', -discount);
  if (taxRate > 0) writeTotal(`Tax (${taxRate}%)`, tax);
  doc.moveTo(totalsLabelX, y).lineTo(doc.page.width - MARGIN, y).strokeColor(LINE).stroke();
  y += 8;
  writeTotal(markPaid ? 'Total Paid' : 'Total Due', total, true);

  if (markPaid) {
    doc.save();
    doc.rotate(-20, { origin: [doc.page.width / 2, y + 30] });
    doc.fillColor('#10b981').opacity(0.15).font('Helvetica-Bold').fontSize(90)
      .text('PAID', doc.page.width / 2 - 150, y + 10, {
        width: 300, align: 'center', lineBreak: false,
      });
    doc.restore();
    doc.opacity(1);
  }

  y += 28;
  resetX(doc);
  if (invoice.notes) {
    doc.y = y;
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
      .text('NOTES', MARGIN, doc.y, { characterSpacing: 0.7, lineBreak: false });
    doc.y += 14;
    doc.fillColor(INK).font('Helvetica').fontSize(10)
      .text(invoice.notes, MARGIN, doc.y, { width: contentWidth(doc) });
    y = doc.y + 12;
  }

  if (!markPaid) {
    const lines = [];
    if (process.env.ZELLE_RECIPIENT) {
      lines.push(`Zelle: ${process.env.ZELLE_RECIPIENT}${process.env.ZELLE_DISPLAY_NAME ? ' (' + process.env.ZELLE_DISPLAY_NAME + ')' : ''}`);
    }
    if (lines.length) {
      doc.y = y;
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
        .text('PAYMENT METHOD', MARGIN, doc.y, { characterSpacing: 0.7, lineBreak: false });
      doc.y += 14;
      doc.fillColor(INK).font('Helvetica').fontSize(10)
        .text(lines.join('\n'), MARGIN, doc.y, { width: contentWidth(doc) });
    }
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc);
  }

  doc.end();
  return await out;
}
