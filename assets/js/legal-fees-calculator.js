// ============================================
// Legal Fees Calculator — Solicitors' Remuneration Order (SRO) 2023
// + Stamp Duty on Memorandum of Transfer (Budget 2026 rates)
//
// Legal fee tiers verified against official sample calculations:
// RM300k -> base RM3,750 | RM1M -> base RM11,250 | RM5M -> base RM51,250
//
// Stamp duty (MOT), effective 1 Jan 2026:
//   Local (citizen/PR), tiered:
//     First RM100,000 @ 1%
//     Next RM400,000 (RM100,001–500,000) @ 2%
//     Next RM500,000 (RM500,001–1,000,000) @ 3%
//     Above RM1,000,000 @ 4%
//   Foreigner: flat 8% on full property value
// ============================================

function calcBaseLegalFee(price) {
  let fee = 0;
  let remaining = price;

  const t1 = Math.min(remaining, 500000);
  fee += t1 * 0.0125;
  remaining -= t1;
  if (remaining <= 0) return fee;

  const t2 = Math.min(remaining, 1000000);
  fee += t2 * 0.01;
  remaining -= t2;
  if (remaining <= 0) return fee;

  const t3 = Math.min(remaining, 1000000);
  fee += t3 * 0.01;
  remaining -= t3;
  if (remaining <= 0) return fee;

  const t4 = Math.min(remaining, 7500000 - 2500000);
  fee += t4 * 0.01;
  remaining -= t4;
  if (remaining <= 0) return fee;

  fee += remaining * 0.01;
  return fee;
}

function calcStampDuty(price, buyerType) {
  if (buyerType === 'foreign') {
    return price * 0.08;
  }
  // Local (citizen/PR): tiered 1% / 2% / 3% / 4%
  let duty = 0;
  let remaining = price;

  const t1 = Math.min(remaining, 100000);
  duty += t1 * 0.01;
  remaining -= t1;
  if (remaining <= 0) return duty;

  const t2 = Math.min(remaining, 400000);
  duty += t2 * 0.02;
  remaining -= t2;
  if (remaining <= 0) return duty;

  const t3 = Math.min(remaining, 500000);
  duty += t3 * 0.03;
  remaining -= t3;
  if (remaining <= 0) return duty;

  duty += remaining * 0.04;
  return duty;
}

document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('lName');
  const emailEl = document.getElementById('lEmail');
  const emailErrorEl = document.getElementById('lEmailError');
  const phoneEl = document.getElementById('lPhone');
  const phoneErrorEl = document.getElementById('lPhoneError');
  const priceEl = document.getElementById('price');
  const buyerTypeEl = document.getElementById('buyerType');
  const whatsappBtn = document.getElementById('whatsappBtn');
  const downloadBtn = document.getElementById('downloadQuoteBtn');

  if (!priceEl) return; // not on this page

  const checkEmail = attachEmailValidation(emailEl, emailErrorEl, false);
  const checkPhone = attachPhoneValidation(phoneEl, phoneErrorEl, false);

  function fmtRM(amount) {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 2,
    }).format(amount).replace(/\u00A0/g, ' ');
  }

  let calcState = null;

  function resetFormFields() {
    nameEl.value = '';
    emailEl.value = '';
    phoneEl.value = '';
    priceEl.value = 0;
    buyerTypeEl.value = '';
    setFieldError(emailEl, emailErrorEl, '');
    setFieldError(phoneEl, phoneErrorEl, '');
  }

  function recalc() {
    const price = Math.max(0, parseFloat(priceEl.value) || 0);
    const buyerType = buyerTypeEl.value;

    if (!buyerType) {
      document.getElementById('r-base').textContent = fmtRM(0);
      document.getElementById('r-sst').textContent = fmtRM(0);
      document.getElementById('r-stampduty').textContent = fmtRM(0);
      document.getElementById('r-total').textContent = fmtRM(0);
      document.getElementById('s-price').textContent = fmtRM(price);
      document.getElementById('s-buyertype').textContent = '—';
      calcState = null;
      return;
    }

    const isForeign = buyerType === 'foreign';
    const sstRate = isForeign ? 0.08 : 0.06;

    const base = calcBaseLegalFee(price);
    const sst = base * sstRate;
    const stampDuty = calcStampDuty(price, buyerType);
    const total = base + sst + stampDuty;

    document.getElementById('r-base').textContent = fmtRM(base);
    document.getElementById('r-sst').textContent = `${fmtRM(sst)} (${(sstRate * 100).toFixed(0)}%)`;
    document.getElementById('r-stampduty').textContent = fmtRM(stampDuty);
    document.getElementById('r-total').textContent = fmtRM(total);

    document.getElementById('s-price').textContent = fmtRM(price);
    document.getElementById('s-buyertype').textContent = isForeign ? t('legalCalc.optForeign', 'Foreigner') : t('legalCalc.optLocal', 'Local (Malaysian / PR)');

    calcState = {
      price: fmtRM(price),
      buyerType: isForeign ? t('legalCalc.optForeign', 'Foreigner') : t('legalCalc.optLocal', 'Local (Malaysian / PR)'),
      base: fmtRM(base),
      sst: `${fmtRM(sst)} (${(sstRate * 100).toFixed(0)}%)`,
      stampDuty: fmtRM(stampDuty),
      total: fmtRM(total),
    };
  }

  function buildLeadData() {
    return {
      name: nameEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      email: emailEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      phone: phoneEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
    };
  }

  function generatePdf() {
    const emailOk = checkEmail();
    const phoneOk = checkPhone();
    if (!emailOk || !phoneOk) return;
    if (!calcState) return;

    const lead = buildLeadData();
    const s = calcState;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const PDF_FONT_MAP = {
      zh: { file: typeof NOTO_SANS_SC_BASE64 !== 'undefined' ? NOTO_SANS_SC_BASE64 : null, name: 'NotoSansSC' },
      km: { file: typeof NOTO_SANS_KHMER_BASE64 !== 'undefined' ? NOTO_SANS_KHMER_BASE64 : null, name: 'NotoSansKhmer' },
      my: { file: typeof NOTO_SANS_MYANMAR_BASE64 !== 'undefined' ? NOTO_SANS_MYANMAR_BASE64 : null, name: 'NotoSansMyanmar' },
      th: { file: typeof NOTO_SANS_THAI_BASE64 !== 'undefined' ? NOTO_SANS_THAI_BASE64 : null, name: 'NotoSansThai' },
      ko: { file: typeof NOTO_SANS_KR_BASE64 !== 'undefined' ? NOTO_SANS_KR_BASE64 : null, name: 'NotoSansKR' },
      ja: { file: typeof NOTO_SANS_JP_BASE64 !== 'undefined' ? NOTO_SANS_JP_BASE64 : null, name: 'NotoSansJP' },
    };
    const fontEntry = PDF_FONT_MAP[CALC_LANG];
    const useCustomFont = fontEntry && fontEntry.file;
    if (useCustomFont) {
      const fileName = fontEntry.name + '.ttf';
      doc.addFileToVFS(fileName, fontEntry.file);
      doc.addFont(fileName, fontEntry.name, 'normal');
      doc.addFont(fileName, fontEntry.name, 'bold');
      doc.addFont(fileName, fontEntry.name, 'italic');
    }
    const PDF_FONT = useCustomFont ? fontEntry.name : 'helvetica';

    const GOLD = [169, 130, 47];
    const INK = [35, 31, 24];
    const INK_SOFT = [74, 68, 56];
    const WHITE = [255, 255, 255];
    const LEFT = 14;
    const RIGHT = 196;
    const WIDTH = RIGHT - LEFT;

    let y = 14;

    if (typeof DCMS_LOGO_BASE64 !== 'undefined') {
      try { doc.addImage(DCMS_LOGO_BASE64, 'PNG', LEFT, y - 2, 42, 42); } catch (e) { /* ignore */ }
    }
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text('DCMS (MM2H) Sdn Bhd', RIGHT, y + 2, { align: 'right' });
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    doc.text('202501033290 (1634700-T)', RIGHT, y + 7, { align: 'right' });
    const addrLines = doc.splitTextToSize('12-03 (2) Stellar Suites, Jalan Puteri 4/7, Bandar Puteri, 47100 Puchong, Selangor Darul Ehsan, Malaysia', 90);
    doc.text(addrLines, RIGHT, y + 12, { align: 'right' });
    const afterAddrY = y + 12 + (addrLines.length - 1) * 3.6;
    doc.text('Office: +603-5040 1349', RIGHT, afterAddrY + 5, { align: 'right' });
    doc.text('bj-mm2h@dcmktgsolution.com', RIGHT, afterAddrY + 9.5, { align: 'right' });

    y = Math.max(y + 46, afterAddrY + 15);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(LEFT, y, RIGHT, y);
    y += 9;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...GOLD);
    doc.text(t('legalCalc.pdfEstimateTitle', 'Legal Fees Estimate'), LEFT, y);
    y += 9;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(t('legalCalc.pdfGeneratedFor', 'Prepared for'), LEFT, y);
    doc.setFont(PDF_FONT, 'normal');
    doc.setTextColor(...INK_SOFT);
    doc.text(`${lead.name}  |  ${lead.email}  |  ${lead.phone}`, LEFT, y + 5);
    y += 13;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(t('legalCalc.summaryTitle', 'Selection Summary'), LEFT, y);
    y += 6;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    [
      [t('legalCalc.summaryPrice', 'Property Price'), s.price],
      [t('legalCalc.summaryBuyerType', 'Buyer Type'), s.buyerType],
    ].forEach(([label, val]) => {
      doc.setTextColor(...INK_SOFT);
      doc.text(label, LEFT, y);
      doc.setTextColor(...INK);
      doc.setFont(PDF_FONT, 'bold');
      doc.text(String(val), RIGHT, y, { align: 'right' });
      doc.setFont(PDF_FONT, 'normal');
      y += 5.5;
    });
    y += 4;

    function drawBar(label, value, height = 8, fontSize = 9.5) {
      doc.setFillColor(...GOLD);
      doc.rect(LEFT, y, WIDTH, height, 'F');
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(...WHITE);
      doc.text(label, LEFT + 2, y + height / 2 + fontSize * 0.32);
      if (value !== null) doc.text(String(value), RIGHT - 2, y + height / 2 + fontSize * 0.32, { align: 'right' });
      y += height;
    }

    function drawRow(label, value) {
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(...INK_SOFT);
      doc.text(label, LEFT + 2, y + 4.5);
      doc.setFont(PDF_FONT, 'bold');
      doc.setTextColor(...INK);
      doc.text(String(value), RIGHT - 2, y + 4.5, { align: 'right' });
      doc.setDrawColor(230, 224, 210);
      doc.setLineWidth(0.2);
      doc.line(LEFT, y + 7, RIGHT, y + 7);
      y += 7;
    }

    drawBar(t('legalCalc.feesTitle', 'Legal & Stamp Duty Fees'), t('legalCalc.amountCol', 'Amount'));
    drawRow(t('legalCalc.resultBaseFee', 'Base statutory legal fee'), s.base);
    drawRow(t('legalCalc.resultSst', 'Service Tax (SST)'), s.sst);
    drawRow(t('legalCalc.resultStampDuty', 'Stamp duty (Memorandum of Transfer)'), s.stampDuty);
    y += 4;

    drawBar(t('legalCalc.grandTotal', 'Grand Total'), s.total, 10, 12);
    y += 10;

    doc.setFont(PDF_FONT, 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    const note = t('legalCalc.note', 'This estimate covers professional legal fees, applicable Service Tax, and Memorandum of Transfer stamp duty only. It excludes legal disbursements (title searches, bankruptcy searches, registration fees, transport, printing) and State Consent application legal fees for foreign purchasers.');
    const noteLines = doc.splitTextToSize(note, WIDTH);
    doc.text(noteLines, LEFT, y);
    y += noteLines.length * 4 + 8;

    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.text('DCMS (MM2H) Sdn Bhd  |  202501033290 (1634700-T)  |  bj-mm2h@dcmktgsolution.com  |  +603-5040 1349', LEFT, y);

    doc.save('DCMS-Legal-Fees-Quote.pdf');
  }

  function openWhatsApp() {
    const lead = buildLeadData();
    const s = calcState;
    const text = [
      t('legalCalc.waGreeting', "Hi DCMS, I'd like to know more about legal fees for a property purchase."),
      `${t('mm2hCalc.summaryName', 'Name')}: ${lead.name}`,
      `${t('legalCalc.summaryPrice', 'Property Price')}: ${s ? s.price : '—'}`,
      `${t('legalCalc.summaryBuyerType', 'Buyer Type')}: ${s ? s.buyerType : '—'}`,
      `${t('legalCalc.waGrandTotalLabel', 'Estimated Grand Total')}: ${s ? s.total : '—'}`,
    ].join('\n');
    window.open(`https://wa.me/60123683149?text=${encodeURIComponent(text)}`, '_blank');
  }

  [priceEl, buyerTypeEl].forEach(el => {
    el.addEventListener('input', recalc);
    el.addEventListener('change', recalc);
  });

  downloadBtn.addEventListener('click', generatePdf);

  onCalcLangChange(() => { recalc(); });

  loadCalcDict().then(() => {
    resetFormFields();
    recalc();
  });
});

// Force a clean reset if the page is restored from the browser's back-forward cache.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});
