// ============================================
// MM2H Calculator logic (v4 — formal quotation layout)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('cName');
  const emailEl = document.getElementById('cEmail');
  const emailErrorEl = document.getElementById('cEmailError');
  const phoneEl = document.getElementById('cPhone');
  const phoneErrorEl = document.getElementById('cPhoneError');
  const categoryEl = document.getElementById('category');
  const ageEl = document.getElementById('age');
  const nationalityEl = document.getElementById('nationality');
  const dependentsEl = document.getElementById('dependents');
  const currencyEl = document.getElementById('currency');
  const durationEl = document.getElementById('duration');
  const ageWarningEl = document.getElementById('ageWarning');
  const downloadBtn = document.getElementById('downloadQuoteBtn');
  const feeSummaryBody = document.getElementById('feeSummaryBody');
  const feeColAmountHeader = document.getElementById('feeColAmountHeader');

  if (!categoryEl) return; // not on this page

  const DEFAULTS = { name: '', email: '', phone: '', category: '', age: '', nationality: '', dependents: '', currency: 'MYR' };

  function populateCountryDropdown() {
    if (typeof WORLD_COUNTRIES === 'undefined') return;
    WORLD_COUNTRIES.forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      nationalityEl.appendChild(opt);
    });
  }

  function resetFormFields() {
    nameEl.value = DEFAULTS.name;
    emailEl.value = DEFAULTS.email;
    phoneEl.value = DEFAULTS.phone;
    categoryEl.value = DEFAULTS.category;
    ageEl.value = DEFAULTS.age;
    nationalityEl.value = DEFAULTS.nationality;
    dependentsEl.value = DEFAULTS.dependents;
    currencyEl.value = DEFAULTS.currency;
    setFieldError(emailEl, emailErrorEl, '');
    setFieldError(phoneEl, phoneErrorEl, '');
  }

  populateCountryDropdown();

  const checkEmail = attachEmailValidation(emailEl, emailErrorEl, false);
  const checkPhone = attachPhoneValidation(phoneEl, phoneErrorEl, false);

  function fmtNum(amount) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  function convert(amountRM, currency) {
    return currency === 'USD' ? amountRM / USD_TO_MYR_RATE : amountRM;
  }

  const CAT_LABEL_KEYS = {
    platinum: 'mm2hCalc.catLabelPlatinum',
    gold: 'mm2hCalc.catLabelGold',
    silver: 'mm2hCalc.catLabelSilver',
    sez_young: 'mm2hCalc.catLabelSezYoung',
    sez_senior: 'mm2hCalc.catLabelSezSenior',
  };
  const CAT_TERM_KEYS = {
    platinum: 'mm2hCalc.catTermPlatinum',
    gold: 'mm2hCalc.catTermGold',
    silver: 'mm2hCalc.catTermSilver',
    sez_young: 'mm2hCalc.catTermSezYoung',
    sez_senior: 'mm2hCalc.catTermSezSenior',
  };
  function getCatLabel(catKey, cat) {
    return t(CAT_LABEL_KEYS[catKey], cat.label);
  }
  function getCatTerm(catKey, cat) {
    return t(CAT_TERM_KEYS[catKey], cat.term);
  }

  function depNoun(n) {
    return n === 1 ? t('mm2hCalc.depNounSingular', 'dependant') : t('mm2hCalc.depNounPlural', 'dependants');
  }

  let calcState = null;

  function recalc() {
    const catKey = categoryEl.value;
    const cat = MM2H_CATEGORIES[catKey];
    const age = parseInt(ageEl.value, 10) || 0;
    const dependents = Math.max(0, parseInt(dependentsEl.value, 10) || 0);
    const currency = currencyEl.value;

    if (feeColAmountHeader) feeColAmountHeader.textContent = t('mm2hCalc.feeColAmount', 'Amount {currency}', { currency });

    if (!catKey || !cat) {
      durationEl.value = '0';
      ageWarningEl.style.display = 'none';
      feeSummaryBody.innerHTML = '';
      document.getElementById('s-category').textContent = '—';
      document.getElementById('s-age').textContent = age ? String(age) : '—';
      document.getElementById('s-nationality').textContent = nationalityEl.value.trim() || '—';
      document.getElementById('s-dependents').textContent = dependents;
      document.getElementById('s-duration').textContent = '—';
      document.getElementById('s-currency').textContent = currency;
      calcState = null;
      return;
    }

    const catLabel = getCatLabel(catKey, cat);
    const catTerm = getCatTerm(catKey, cat);
    durationEl.value = catTerm;

    if (age > 0 && age < cat.minAge) {
      ageWarningEl.style.display = 'block';
      ageWarningEl.textContent = t('mm2hCalc.ageWarningTemplate', '{category}: minimum principal applicant age is {minAge}.', { category: catLabel, minAge: cat.minAge });
    } else {
      ageWarningEl.style.display = 'none';
    }

    // ---- Fee Summary rows ----
    const agency = MM2H_AGENCY_FEES[catKey];
    const participatingRM = cat.participatingFeeRM;
    const processingPrincipalRM = MM2H_PROCESSING_FEE_PRINCIPAL_RM;
    const agencyFeeRM = agency.agencyFeeRM;
    const processingDependentsRM = dependents * MM2H_PROCESSING_FEE_PER_DEPENDENT_RM;

    const govLabel = t('mm2hCalc.feeTypeGovernment', 'Government fee');
    const svcLabel = t('mm2hCalc.feeTypeService', 'DCMS service fee');

    const feeRows = [
      { desc: t('mm2hCalc.rowParticipationFee', 'MM2H participation fee'), type: govLabel, amountRM: participatingRM },
      { desc: t('mm2hCalc.rowProcessingPrincipal', 'Processing fee for principal applicant'), type: govLabel, amountRM: processingPrincipalRM },
      { desc: t('mm2hCalc.rowAgencyFee', 'Professional agency fee'), type: svcLabel, amountRM: agencyFeeRM },
    ];
    if (dependents > 0) {
      feeRows.push({
        desc: t('mm2hCalc.rowProcessingDependent', 'Processing fee for {n} {noun}', { n: dependents, noun: depNoun(dependents) }),
        type: govLabel,
        amountRM: processingDependentsRM,
      });
    }
    const totalRM = participatingRM + processingPrincipalRM + agencyFeeRM + processingDependentsRM;

    feeSummaryBody.innerHTML =
      feeRows.map(r => `<tr><td>${r.desc}</td><td>${r.type}</td><td>${fmtNum(convert(r.amountRM, currency))}</td></tr>`).join('') +
      `<tr class="fee-subtotal"><td>${t('mm2hCalc.estimatedTotal', 'Estimated Total')}</td><td></td><td>${fmtNum(convert(totalRM, currency))}</td></tr>`;

    // ---- Selection summary ----
    document.getElementById('s-category').textContent = catLabel;
    document.getElementById('s-age').textContent = age || '—';
    document.getElementById('s-nationality').textContent = nationalityEl.value.trim() || '—';
    document.getElementById('s-dependents').textContent = dependents;
    document.getElementById('s-duration').textContent = catTerm;
    document.getElementById('s-currency').textContent = currency;

    calcState = {
      category: catLabel,
      age: age || null,
      nationality: nationalityEl.value.trim() || null,
      dependents,
      duration: catTerm,
      currency,
      feeRows: feeRows.map(r => ({ desc: r.desc, type: r.type, amount: fmtNum(convert(r.amountRM, currency)) })),
      total: fmtNum(convert(totalRM, currency)),
    };
  }

  function buildSummaryData() {
    const catKey = categoryEl.value;
    const cat = MM2H_CATEGORIES[catKey];
    return {
      name: nameEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      email: emailEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      phone: phoneEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      category: cat ? getCatLabel(catKey, cat) : t('mm2hCalc.notSelected', 'Not selected'),
      age: ageEl.value || '—',
      nationality: nationalityEl.value.trim() || t('mm2hCalc.notProvided', 'Not provided'),
      dependents: dependentsEl.value || '0',
      duration: cat ? getCatTerm(catKey, cat) : '—',
      currency: currencyEl.value,
      total: calcState ? calcState.total : '—',
    };
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function makeQuotationNo() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `DCMS/Q/${y}${m}${d}-${hh}${mm}${ss}`;
  }

  function generatePdf() {
    const emailOk = checkEmail();
    const phoneOk = checkPhone();
    if (!emailOk || !phoneOk) return;
    if (!calcState) { alert(t('mm2hCalc.alertSelectCategory', 'Please select an MM2H category first.')); return; }

    const d = buildSummaryData();
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
    const CREAM = [247, 234, 205];
    const INK = [35, 31, 24];
    const INK_SOFT = [74, 68, 56];
    const WHITE = [255, 255, 255];
    const LEFT = 14;
    const RIGHT = 196;
    const WIDTH = RIGHT - LEFT;
    let pageNum = 1;

    function pageFooter() {
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK_SOFT);
      doc.text(t('mm2hCalc.pdfPageFooter', 'DCMS (MM2H) Sdn Bhd | Confidential Fee Quotation | Page {n}', { n: pageNum }), 105, 289, { align: 'center' });
    }

    function checkPageBreak(neededHeight, y) {
      if (y + neededHeight > 280) {
        pageFooter();
        doc.addPage();
        pageNum += 1;
        return 18;
      }
      return y;
    }

    // ================= PAGE 1 =================
    let y = 14;

    if (typeof DCMS_LOGO_BASE64 !== 'undefined') {
      try { doc.addImage(DCMS_LOGO_BASE64, 'PNG', LEFT, y - 2, 30, 30); } catch (e) { /* ignore */ }
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
    doc.text('Office +603-5040 1349   Email bj-mm2h@dcmktgsolution.com', RIGHT, afterAddrY + 5, { align: 'right' });

    y = Math.max(y + 34, afterAddrY + 12);
    y += 6;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.docTitle', 'MM2H Service Fee Quotation'), LEFT, y);
    y += 8;

    // ---- Quotation metadata table ----
    const quotationNo = makeQuotationNo();
    const quotationDate = formatDate(new Date());
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const validUntil = formatDate(validUntilDate);

    function metaRow(y, label1, val1, label2, val2, shaded) {
      const rowH = 7.5;
      if (shaded) {
        doc.setFillColor(...CREAM);
        doc.rect(LEFT, y, WIDTH, rowH, 'F');
      }
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.2);
      doc.rect(LEFT, y, WIDTH, rowH);
      doc.line(LEFT + WIDTH * 0.28, y, LEFT + WIDTH * 0.28, y + rowH);
      doc.line(LEFT + WIDTH * 0.63, y, LEFT + WIDTH * 0.63, y + rowH);
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(8.3);
      doc.setTextColor(...INK);
      doc.text(label1, LEFT + 2, y + rowH / 2 + 1.4);
      doc.text(label2, LEFT + WIDTH * 0.63 + 2, y + rowH / 2 + 1.4);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(...INK_SOFT);
      const val1Lines = doc.splitTextToSize(String(val1), WIDTH * 0.35 - 4);
      doc.text(val1Lines, LEFT + WIDTH * 0.28 + 2, y + rowH / 2 + 1.4);
      doc.text(String(val2), LEFT + WIDTH * 0.63 + WIDTH * 0.20, y + rowH / 2 + 1.4);
      return y + rowH;
    }

    y = metaRow(y, t('mm2hCalc.quotationNoLabel', 'Quotation No.'), quotationNo, t('mm2hCalc.quotationDateLabel', 'Quotation Date'), quotationDate, true);
    y = metaRow(y, t('mm2hCalc.preparedForLabel', 'Prepared For'), d.name, t('mm2hCalc.validUntilLabel', 'Valid Until'), validUntil, false);
    y = metaRow(y, t('mm2hCalc.summaryEmail', 'Email'), d.email, t('mm2hCalc.contactNoLabel', 'Contact No.'), d.phone, true);
    y += 8;

    // ---- Applicant Selection Summary ----
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(t('mm2hCalc.selectionSummaryTitle', 'Applicant Selection Summary'), LEFT, y);
    y += 5;

    const summaryCols = [
      [t('mm2hCalc.colCategory', 'Category'), t('mm2hCalc.colAge', 'Age'), t('mm2hCalc.colNationality', 'Nationality'), t('mm2hCalc.colDependants', 'Dependants'), t('mm2hCalc.colDuration', 'Duration'), t('mm2hCalc.colCurrency', 'Currency')],
    ];
    const summaryVals = [String(s.category), String(d.age), String(d.nationality), String(s.dependents), String(s.duration), String(s.currency)];
    const colW = WIDTH / 6;
    doc.setFillColor(...GOLD);
    doc.rect(LEFT, y, WIDTH, 7, 'F');
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    summaryCols[0].forEach((c, i) => doc.text(c, LEFT + i * colW + 2, y + 4.8));
    y += 7;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    const summaryWrapped = summaryVals.map(v => doc.splitTextToSize(v, colW - 4));
    const summaryRowH = Math.max(9, Math.max(...summaryWrapped.map(lines => lines.length)) * 3.8 + 3.5);
    doc.setDrawColor(220, 210, 190);
    doc.rect(LEFT, y, WIDTH, summaryRowH);
    summaryWrapped.forEach((lines, i) => {
      doc.text(lines, LEFT + i * colW + 2, y + 5.2);
    });
    y += summaryRowH + 8;

    // ---- Fee Summary ----
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(t('mm2hCalc.feeSummaryTitle', 'Fee Summary'), LEFT, y);
    y += 5;

    const feeColW = [WIDTH * 0.48, WIDTH * 0.24, WIDTH * 0.28];
    const amountHeader = t('mm2hCalc.feeColAmount', 'Amount {currency}', { currency: s.currency });
    doc.setFillColor(...GOLD);
    doc.rect(LEFT, y, WIDTH, 7, 'F');
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text(t('mm2hCalc.feeColDescription', 'Description'), LEFT + 2, y + 4.8);
    doc.text(t('mm2hCalc.feeColType', 'Fee Type'), LEFT + feeColW[0] + 2, y + 4.8);
    doc.text(amountHeader, RIGHT - 2, y + 4.8, { align: 'right' });
    y += 7;

    function feeRow(y, desc, type, amount, bold) {
      const rowH = 7;
      y = checkPageBreak(rowH, y);
      if (bold) { doc.setFillColor(...CREAM); doc.rect(LEFT, y, WIDTH, rowH, 'F'); }
      doc.setDrawColor(230, 224, 210);
      doc.setLineWidth(0.2);
      doc.rect(LEFT, y, WIDTH, rowH);
      doc.setFont(PDF_FONT, bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      const descLines = doc.splitTextToSize(desc, feeColW[0] - 4);
      doc.text(descLines[0] || '', LEFT + 2, y + 4.6);
      doc.text(type || '', LEFT + feeColW[0] + 2, y + 4.6);
      doc.text(String(amount), RIGHT - 2, y + 4.6, { align: 'right' });
      return y + rowH;
    }

    s.feeRows.forEach(r => { y = feeRow(y, r.desc, r.type, r.amount, false); });
    y = feeRow(y, t('mm2hCalc.estimatedTotal', 'Estimated Total'), '', s.total, true);
    y += 5;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(t('mm2hCalc.importantLabel', 'Important:'), LEFT, y);
    doc.setFont(PDF_FONT, 'italic');
    doc.setTextColor(...INK_SOFT);
    const impLines = doc.splitTextToSize(t('mm2hCalc.importantNoteText', 'The estimated total includes the government fees listed above. Government charges are payable at the prevailing rates imposed by the relevant authorities and may change without prior notice.'), WIDTH - 18);
    doc.text(impLines, LEFT + 18, y);
    y += impLines.length * 3.6 + 8;

    // ---- Other Estimated Costs ----
    y = checkPageBreak(40, y);
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(t('mm2hCalc.otherCostsTitle', 'Other Estimated Costs'), LEFT, y);
    y += 5;

    const otherColW = [WIDTH * 0.42, WIDTH * 0.58];
    doc.setFillColor(...GOLD);
    doc.rect(LEFT, y, WIDTH, 7, 'F');
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text(t('mm2hCalc.otherCostsColItem', 'Item'), LEFT + 2, y + 4.8);
    doc.text(t('mm2hCalc.otherCostsColTreatment', 'Treatment'), RIGHT - 2, y + 4.8, { align: 'right' });
    y += 7;

    const otherRows = [
      [t('mm2hCalc.otherCost1Item', 'Medical examination'), t('mm2hCalc.otherCost1Treatment', 'Payable separately based on actual cost')],
      [t('mm2hCalc.otherCost2Item', 'Medical insurance'), t('mm2hCalc.otherCost2Treatment', 'Payable separately based on actual cost')],
      [t('mm2hCalc.otherCost3Item', 'Visa or pass endorsement and MEV fees'), t('mm2hCalc.otherCost3Treatment', 'To be advised based on the prevailing official rates')],
      [t('mm2hCalc.otherCost4Item', 'Translation, certification, legalisation and courier'), t('mm2hCalc.otherCost4Treatment', 'Payable separately where applicable')],
    ];
    otherRows.forEach(([item, treatment]) => {
      const itemLines = doc.splitTextToSize(item, otherColW[0] - 4);
      const treatLines = doc.splitTextToSize(treatment, otherColW[1] - 4);
      const rowH = Math.max(itemLines.length, treatLines.length) * 3.8 + 2.5;
      y = checkPageBreak(rowH, y);
      doc.setDrawColor(230, 224, 210);
      doc.rect(LEFT, y, WIDTH, rowH);
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8.3);
      doc.setTextColor(...INK_SOFT);
      doc.text(itemLines, LEFT + 2, y + 4.2);
      doc.text(treatLines, RIGHT - 2, y + 4.2, { align: 'right' });
      y += rowH;
    });
    y += 6;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    const discLines = doc.splitTextToSize(t('mm2hCalc.quotationFooterDisclaimer', 'This quotation is an estimate only and is not a tax invoice or proof of payment.'), WIDTH);
    doc.text(discLines, LEFT, y);

    pageFooter();

    // ================= PAGE 2 =================
    doc.addPage();
    pageNum += 1;
    y = 18;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.pdfScopeTitle', 'Scope of Professional Services'), LEFT, y);
    y += 6;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    [
      t('mm2hCalc.pdfScopeItem1', 'Initial eligibility assessment based on the information provided by the applicant.'),
      t('mm2hCalc.pdfScopeItem2', 'Document checklist, review and preparation support for the MM2H application.'),
      t('mm2hCalc.pdfScopeItem3', 'Application submission coordination and liaison with the relevant authorities.'),
      t('mm2hCalc.pdfScopeItem4', 'Application status follow-up and coordination up to the applicable approval or endorsement stage.'),
    ].forEach(item => {
      const lines = doc.splitTextToSize(item, WIDTH - 6);
      doc.text('•', LEFT, y);
      doc.text(lines, LEFT + 5, y);
      y += lines.length * 4.6 + 1.5;
    });
    y += 4;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.pdfExclusionsTitle', 'Exclusions'), LEFT, y);
    y += 6;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    const exclLines = doc.splitTextToSize(t('mm2hCalc.pdfExclusionsText', "Unless specifically stated in the Fee Summary, the professional agency fee excludes translation, certification, legalisation, courier charges, medical examination, medical insurance, security bond, visa or pass endorsement fees, multiple-entry visa fees, travel expenses and other third-party or government charges."), WIDTH);
    doc.text(exclLines, LEFT, y);
    y += exclLines.length * 4.6 + 8;

    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.pdfPaymentTermsTitle', 'Payment Terms'), LEFT, y);
    y += 6;

    const payColW = [WIDTH * 0.42, WIDTH * 0.33, WIDTH * 0.25];
    doc.setFillColor(...GOLD);
    doc.rect(LEFT, y, WIDTH, 7, 'F');
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    doc.text(t('mm2hCalc.pdfPaymentColStage', 'Payment Stage'), LEFT + 2, y + 4.8);
    doc.text(t('mm2hCalc.pdfPaymentColAmount', 'Amount or Percentage'), LEFT + payColW[0] + 2, y + 4.8);
    doc.text(t('mm2hCalc.pdfPaymentColDue', 'Due Date'), RIGHT - 2, y + 4.8, { align: 'right' });
    y += 7;
    [
      [t('mm2hCalc.pdfPaymentStage1', 'Upon engagement'), t('mm2hCalc.pdfPaymentAmount1', '20% deposit')],
      [t('mm2hCalc.pdfPaymentStage2', 'Upon approval and issuance of MM2H pass'), t('mm2hCalc.pdfPaymentAmount2', 'Remaining 80%')],
    ].forEach(([stage, amount]) => {
      const stageLines = doc.splitTextToSize(stage, payColW[0] - 4);
      const rowH = Math.max(stageLines.length, 1) * 3.8 + 2.5;
      doc.setDrawColor(230, 224, 210);
      doc.rect(LEFT, y, WIDTH, rowH);
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK_SOFT);
      doc.text(stageLines, LEFT + 2, y + 4.4);
      doc.text(amount, LEFT + payColW[0] + 2, y + 4.4);
      doc.text(t('mm2hCalc.pdfPaymentDue', '—'), RIGHT - 2, y + 4.4, { align: 'right' });
      y += rowH;
    });
    y += 6;

    doc.setFont(PDF_FONT, 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...INK_SOFT);
    const payInstrLines = doc.splitTextToSize(t('mm2hCalc.pdfPaymentInstructions', 'Payment shall be made only to the bank account stated in the official invoice issued by DCMS (MM2H) Sdn Bhd. An official receipt will be issued upon clearance of funds.'), WIDTH);
    doc.text(payInstrLines, LEFT, y);
    y += payInstrLines.length * 3.8 + 8;

    y = checkPageBreak(50, y);
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.pdfImportantTermsTitle', 'Important Terms'), LEFT, y);
    y += 6;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    [
      t('mm2hCalc.pdfImportantTerm1', 'Approval of the MM2H application is entirely subject to the decision of the relevant Malaysian authorities. DCMS (MM2H) Sdn Bhd does not guarantee approval.'),
      t('mm2hCalc.pdfImportantTerm2', 'The applicant is responsible for providing complete, accurate and genuine information and supporting documents within the required timeline.'),
      t('mm2hCalc.pdfImportantTerm3', 'Programme requirements, government fees and third-party charges are subject to the prevailing regulations and rates at the time of application, approval and endorsement.'),
      t('mm2hCalc.pdfImportantTerm4', 'Any additional dependant, change in application scope or additional work requested will be quoted separately.'),
      t('mm2hCalc.pdfImportantTerm5', 'Refund and cancellation terms shall be governed by the service engagement agreement signed between the applicant and DCMS (MM2H) Sdn Bhd.'),
      t('mm2hCalc.pdfImportantTerm6', 'This quotation is valid until the date stated on page 1 and supersedes earlier estimates for the same application.'),
    ].forEach(item => {
      const lines = doc.splitTextToSize(item, WIDTH - 6);
      y = checkPageBreak(lines.length * 4.6 + 1.5, y);
      doc.text('•', LEFT, y);
      doc.text(lines, LEFT + 5, y);
      y += lines.length * 4.6 + 1.5;
    });
    y += 6;

    y = checkPageBreak(45, y);
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(t('mm2hCalc.pdfAcceptanceTitle', 'Acceptance of Quotation'), LEFT, y);
    y += 6;
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    const accLines = doc.splitTextToSize(t('mm2hCalc.pdfAcceptanceText', 'I confirm that I have reviewed and accepted this quotation, subject to the service engagement agreement and the terms stated above.'), WIDTH);
    doc.text(accLines, LEFT, y);
    y += accLines.length * 4.6 + 10;

    function signatureLine(y, label1, label2) {
      doc.setDrawColor(...INK_SOFT);
      doc.setLineWidth(0.2);
      doc.line(LEFT, y, LEFT + WIDTH * 0.45, y);
      doc.line(LEFT + WIDTH * 0.55, y, RIGHT, y);
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK_SOFT);
      doc.text(label1, LEFT, y + 4.5);
      doc.text(label2, LEFT + WIDTH * 0.55, y + 4.5);
      return y + 16;
    }
    y = signatureLine(y, t('mm2hCalc.pdfApplicantNameLabel', 'Applicant Name:'), t('mm2hCalc.pdfDateLabel', 'Date:'));
    y = signatureLine(y, t('mm2hCalc.pdfSignatureLabel', 'Signature:'), t('mm2hCalc.pdfPassportNoLabel', 'Passport No.:'));
    y = signatureLine(y, t('mm2hCalc.pdfForCompanyLabel', 'For DCMS (MM2H) Sdn Bhd:'), t('mm2hCalc.pdfDateLabel', 'Date:'));

    pageFooter();

    doc.save('DCMS-MM2H-Service-Fee-Quotation.pdf');
  }

  function openWhatsApp() {
    const d = buildSummaryData();
    const text = [
      t('mm2hCalc.waGreeting', "Hi DCMS, I'd like to know more about MM2H."),
      `${t('mm2hCalc.summaryName', 'Name')}: ${d.name}`,
      `${t('mm2hCalc.summaryCategory', 'Category')}: ${d.category}, ${t('mm2hCalc.summaryAge', 'Age')}: ${d.age}, ${t('mm2hCalc.summaryNationality', 'Nationality')}: ${d.nationality}`,
      `${t('mm2hCalc.summaryDependents', 'Dependents')}: ${d.dependents}`,
      `${t('mm2hCalc.waGrandTotalLabel', 'Estimated Grand Total')}: ${d.total}`,
    ].join('\n');
    window.open(`https://wa.me/60123683149?text=${encodeURIComponent(text)}`, '_blank');
  }

  [categoryEl, ageEl, currencyEl, nationalityEl, nameEl, dependentsEl].forEach(el => {
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

// Force a clean reset if the page is restored from the browser's
// back-forward cache (bfcache), which can otherwise preserve old input values.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});
