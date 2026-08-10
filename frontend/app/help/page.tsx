import Link from 'next/link';
import { ChevronRight, HelpCircle, BookOpen, FileText, Zap } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-topbar';

const categories = [
  {
    title: 'Getting Started',
    icon: <Zap size={24} />,
    articles: [
      'What is Dwaar?',
      'Creating Your First Project',
      'Inviting Team Members',
      'Understanding the Dashboard',
    ],
  },
  {
    title: 'DRHP Preparation',
    icon: <FileText size={24} />,
    articles: [
      '12 DRHP Workstreams Explained',
      'How to Complete Each Section',
      'Managing Evidence and Documents',
      'Tracking Progress and Metrics',
    ],
  },
  {
    title: 'Documentation & Resources',
    icon: <BookOpen size={24} />,
    articles: [
      'SEBI Guidelines Reference',
      'Document Templates',
      'Best Practices for DRHP Filing',
      'Common Issues and Solutions',
    ],
  },
  {
    title: 'Support',
    icon: <HelpCircle size={24} />,
    articles: [
      'Frequently Asked Questions',
      'Contact Support',
      'Report a Bug',
      'Feature Requests',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:mt-0 mt-16">
        <AppTopBar pageTitle="Help & Resources" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto p-6">
            <div className="space-y-12">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-foreground mb-4">Help & Resources</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Find answers and guidance for using Dwaar
                </p>

                {/* Search */}
                <div className="max-w-2xl mx-auto mb-12">
                  <input
                    type="search"
                    placeholder="Search help articles..."
                    className="w-full px-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="grid md:grid-cols-2 gap-6">
                {categories.map((category, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="text-accent">{category.icon}</div>
                      <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                    </div>

                    <div className="space-y-3">
                      {category.articles.map((article, articleIdx) => (
                        <a
                          key={articleIdx}
                          href="#"
                          className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors group"
                        >
                          <span className="text-foreground group-hover:text-accent transition-colors">
                            {article}
                          </span>
                          <ChevronRight
                            size={18}
                            className="text-muted-foreground group-hover:text-accent transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    {
                      q: 'How long does DRHP preparation typically take?',
                      a: 'Most companies complete DRHP preparation in 6-9 months with Dwaar, depending on documentation readiness and complexity.',
                    },
                    {
                      q: 'Can my advisors or team members access my workspace?',
                      a: 'The current prototype focuses on a single issuer workspace. Shared access and external reviewer workflows are planned for a later release.',
                    },
                    {
                      q: 'What documents do I need to upload?',
                      a: "You'll need incorporation certificates, financial statements, board resolutions, director IDs, and other regulatory documents specific to your business.",
                    },
                    {
                      q: 'Is my data secure in Dwaar?',
                      a: 'Yes, all data is encrypted and stored securely. We comply with data protection regulations and SEBI guidelines.',
                    },
                  ].map((faq, idx) => (
                    <details key={idx} className="group bg-card border border-border rounded-lg p-6">
                      <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground">
                        {faq.q}
                        <ChevronRight
                          size={20}
                          className="transition-transform group-open:rotate-90"
                        />
                      </summary>
                      <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Need Additional Help?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is ready to assist you with any questions or issues.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Contact Support
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
