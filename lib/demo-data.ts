import { CompanyProfile, Question } from './types';

export const demoCompany: CompanyProfile = {
  companyName: 'Aarohan Fintech Solutions Private Limited',
  registrationNumber: 'U72900MH2019PTC329847',
  sector: 'Financial Technology',
  businessDescription: 'A technology-led SME providing secure digital onboarding, compliance automation, and investor reporting tools to regulated financial institutions across India.',
  yearOfIncorporation: 2019,
  promotersNames: 'Prathamesh Bhamare - Founder & Promoter (58%); Ananya Rao - Co-founder (17%)',
  boardMembers: 'Prathamesh Bhamare - Managing Director; Ananya Rao - Executive Director; Meera Shah - Independent Director',
  keyFinancials: { turnover: 42.8, profitAfterTax: 6.4, totalAssets: 31.2, year: 2025 },
};

const demoAnswers: Record<string, string | number> = {
  q1: 'We build compliance automation and secure investor reporting software for Indian financial institutions and growth-stage SMEs.',
  q2: 'Digital KYC orchestration, disclosure workflow management, compliance dashboards, and secure document collaboration.',
  q3: 'Yes', q4: 'Compliance SaaS, implementation services, and managed regulatory reporting.',
  q5: 428000000, q6: 64000000, q7: 312000000, q8: 91000000, q9: 'Yes',
  q10: 'Prathamesh Bhamare - Managing Director; Ananya Rao - Executive Director; Meera Shah - Independent Director.',
  q11: 'Yes', q12: 'No material litigation or regulatory action is pending as of the reporting date.', q13: 'Yes',
  q14: 'Cybersecurity, evolving regulation, customer concentration, talent retention, and third-party infrastructure availability.',
  q15: 'Quarterly risk reviews, audited controls, multi-cloud recovery, vendor due diligence, and diversified customer acquisition.',
  q16: 'Expand into six additional states, deepen exchange and intermediary integrations, and grow recurring revenue through modular products.',
  q17: 180000000, q18: 75, q19: 20, q20: 35, q21: 25,
  q22: '35% product and infrastructure CAPEX, 25% working capital, 20% debt repayment, and 20% general corporate purposes and issue expenses.',
};

export function getDemoAnswer(question: Question) {
  return demoAnswers[question.id] ?? (question.options?.[0] || 'Demo response');
}
