'use client';

import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Book, Phone, Mail, MessageSquare } from 'lucide-react';

export default function HelpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  const faqs = [
    {
      question: 'What is DRHP and why do I need it?',
      answer:
        'DRHP (Draft Red Herring Prospectus) is a preliminary offering document filed with SEBI for SME IPOs. It contains all material information about the company and is required for regulatory compliance.',
    },
    {
      question: 'How long does the IPO process take?',
      answer:
        'Typically, the complete IPO process takes 3-6 months depending on document completeness, regulatory reviews, and market conditions. Our platform helps streamline this process.',
    },
    {
      question: 'What documents are mandatory?',
      answer:
        'Mandatory documents include audited financial statements (3 years), board resolution, MOA/AOA, director ID proofs, and compliance certificates. See the Documents section for complete list.',
    },
    {
      question: 'How do I correct errors in my submission?',
      answer:
        'You can edit your company profile and questionnaire responses until final submission. Once submitted for review, changes require admin approval.',
    },
    {
      question: 'What if my IPO gets rejected?',
      answer:
        'SEBI provides feedback on rejections. Our admin team will guide you through the revision process. Most issues can be resolved with additional information or clarifications.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes, all data is stored securely with encryption. We comply with SEBI data protection guidelines and industry best practices for information security.',
    },
    {
      question: 'Can I submit for review with incomplete information?',
      answer:
        'No, all mandatory fields must be completed. Our system shows completion status and specific gaps that need to be filled before submission.',
    },
    {
      question: 'How often should I save my progress?',
      answer:
        'Data is auto-saved as you complete sections. However, it\'s recommended to use the Save button regularly to ensure all changes are persisted.',
    },
  ];

  const resources = [
    {
      title: 'SEBI IPO Guidelines',
      description: 'Official SEBI guidelines for SME IPO process and requirements',
      icon: Book,
      href: '#',
    },
    {
      title: 'Questionnaire Help',
      description: 'Detailed explanations of each questionnaire section and expected answers',
      icon: MessageSquare,
      href: '#',
    },
    {
      title: 'Document Checklist',
      description: 'Complete list of required documents with specifications and formats',
      icon: Book,
      href: '#',
    },
    {
      title: 'Contact Support',
      description: 'Get in touch with our support team for specific guidance',
      icon: Phone,
      href: '#',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Help & Resources</h1>
            <p className="text-muted-foreground">Find answers and guidance for your IPO journey</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid md:grid-cols-2 gap-4">
          <ResourceCard icon={Book} title="SEBI Guidelines" description="Official IPO process requirements" />
          <ResourceCard icon={MessageSquare} title="Questionnaire Help" description="Tips for completing forms" />
          <ResourceCard icon={Book} title="Document Guide" description="Required documents checklist" />
          <ResourceCard icon={Phone} title="Contact Support" description="Reach our support team" />
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground text-left">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedFAQ === index && (
                  <div className="px-6 py-4 border-t border-border bg-muted/30">
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Step-by-Step IPO Guide</h2>

          <div className="space-y-4">
            <GuideStep
              number={1}
              title="Company Registration"
              description="Set up your company profile with all basic information including registration details, business description, and management information."
            />
            <GuideStep
              number={2}
              title="Financial Submission"
              description="Enter your company's financial metrics from the last 3 fiscal years including turnover, PAT, and total assets."
            />
            <GuideStep
              number={3}
              title="Questionnaire Completion"
              description="Answer 22 detailed questions across 5 sections covering company overview, financials, governance, risks, and use of funds."
            />
            <GuideStep
              number={4}
              title="Document Upload"
              description="Submit all required regulatory documents including audited statements, board resolutions, and compliance certificates."
            />
            <GuideStep
              number={5}
              title="DRHP Review"
              description="Review your auto-generated DRHP preview and resolve any gaps identified by our system."
            />
            <GuideStep
              number={6}
              title="Final Submission"
              description="Submit your complete IPO application for admin review and regulatory approval."
            />
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Important Points to Remember</h3>
          <ul className="space-y-3 text-muted-foreground text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>All fields marked with asterisk (*) are mandatory and must be completed.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Financial data should be from audited statements only. Provisional or unaudited data is not accepted.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Board composition must comply with SEBI guidelines regarding independent directors.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>All documents must be in English or certified translations for other languages.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Once submitted for review, changes require written approval from the reviewing authority.</span>
            </li>
          </ul>
        </div>

        {/* Support Contact */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Still Need Help?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our support team is here to help you navigate the IPO process. Get in touch for specific guidance on your application.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button className="gap-2">
              <Mail className="w-4 h-4" />
              Email Support
            </Button>
            <Button variant="outline" className="gap-2">
              <Phone className="w-4 h-4" />
              Call Support
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Support available Monday to Friday, 9:00 AM to 6:00 PM IST
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
          {number}
        </div>
      </div>
      <div className="flex-1 bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
