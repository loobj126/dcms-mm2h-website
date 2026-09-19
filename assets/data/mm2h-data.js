// Official MM2H category data
// Source: One Stop Centre Malaysia My Second Home (OSC MM2H), Ministry of Tourism, Art and Culture
const MM2H_CATEGORIES = {
  platinum: {
    label: 'Platinum',
    fixedDepositUSD: 1000000,
    term: '20 years (renewable)',
    minAge: 25,
    propertyMinRM: 2000000,
    participatingFeeRM: 200000,
    renewalFeeRM: 5000,
    stayRule: '90 days/year (age 25–49) · no minimum for age 50+',
  },
  gold: {
    label: 'Gold',
    fixedDepositUSD: 500000,
    term: '15 years (renewable)',
    minAge: 25,
    propertyMinRM: 1000000,
    participatingFeeRM: 3000,
    renewalFeeRM: 3000,
    stayRule: '90 days/year (age 25–49) · no minimum for age 50+',
  },
  silver: {
    label: 'Silver',
    fixedDepositUSD: 150000,
    term: '5 years (renewable)',
    minAge: 25,
    propertyMinRM: 600000,
    participatingFeeRM: 1000,
    renewalFeeRM: 1500,
    stayRule: '90 days/year (age 25–49) · no minimum for age 50+',
  },
  sez_young: {
    label: 'SEZ / SFZ (Age 21–49)',
    fixedDepositUSD: 65000,
    term: '10 years (renewable)',
    minAge: 21,
    propertyMinRM: null, // varies by SEZ development
    propertyNote: 'Minimum price as set for SEZ property development',
    participatingFeeRM: 1000,
    renewalFeeRM: 300,
    stayRule: '90 days/year',
  },
  sez_senior: {
    label: 'SEZ / SFZ (Age 50+)',
    fixedDepositUSD: 65000,
    term: '10 years (renewable)',
    minAge: 50,
    propertyMinRM: null,
    propertyNote: 'Minimum price as set for SEZ property development',
    participatingFeeRM: 32000, // deposit differs; see below note
    renewalFeeRM: 300,
    stayRule: 'No minimum requirement to stay',
  },
};

// Correcting SEZ deposit split per official table:
// SEZ 21-49: USD 65,000 fixed deposit
// SEZ 50+:   USD 32,000 fixed deposit
MM2H_CATEGORIES.sez_senior.fixedDepositUSD = 32000;
MM2H_CATEGORIES.sez_senior.participatingFeeRM = 1000;

const MM2H_PROCESSING_FEE_PRINCIPAL_RM = 5000;
const MM2H_PROCESSING_FEE_PER_DEPENDENT_RM = 2500;

const MM2H_TERM_YEARS = {
  platinum: 20,
  gold: 15,
  silver: 5,
  sez_young: 10,
  sez_senior: 10,
};

// Agency service fee schedule (Service Fee / Agency Fee) — confirmed by client.
const MM2H_AGENCY_FEES = {
  platinum:   { agencyFeeRM: 70000, medicalInsurancePrincipalRM: null, medicalCheckupPrincipalRM: null },
  gold:       { agencyFeeRM: 55000, medicalInsurancePrincipalRM: null, medicalCheckupPrincipalRM: null },
  silver:     { agencyFeeRM: 40000, medicalInsurancePrincipalRM: null, medicalCheckupPrincipalRM: null },
  sez_young:  { agencyFeeRM: 40000, medicalInsurancePrincipalRM: null, medicalCheckupPrincipalRM: null },
  sez_senior: { agencyFeeRM: 40000, medicalInsurancePrincipalRM: null, medicalCheckupPrincipalRM: null },
};

// Per-dependent fee schedule. Government Processing Fee is the confirmed official
// figure (RM2,500). Visa Fee, Medical Insurance, Medical Checkup, and MEV Fee are
// left empty (null) pending confirmed figures — they display as "—" and are
// excluded from totals until real amounts are provided.
const MM2H_DEPENDENT_FEES = {
  platinum:   { visaFeeRM: null, medicalInsuranceRM: null, medicalCheckupRM: null, mevFeeRM: null },
  gold:       { visaFeeRM: null, medicalInsuranceRM: null, medicalCheckupRM: null, mevFeeRM: null },
  silver:     { visaFeeRM: null, medicalInsuranceRM: null, medicalCheckupRM: null, mevFeeRM: null },
  sez_young:  { visaFeeRM: null, medicalInsuranceRM: null, medicalCheckupRM: null, mevFeeRM: null },
  sez_senior: { visaFeeRM: null, medicalInsuranceRM: null, medicalCheckupRM: null, mevFeeRM: null },
};

// Approximate indicative FX rate for USD -> MYR display only.
// This should be updated periodically; calculator shows it as indicative.
const USD_TO_MYR_RATE = 4.7;
