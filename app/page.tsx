import Link from 'next/link';
import { ArrowRight, CheckCircle2, Zap, BarChart3 } from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-foreground">Dwaar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/role-selection"
              className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          From Company Evidence to a Review-Ready DRHP
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Dwaar simplifies DRHP preparation for Indian SME IPOs. Organize your company information, evidence, and documentation in one intelligent platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/role-selection"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
          >
            I Already Have Access
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            How Dwaar Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                  <span className="font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Provide Information
                </h3>
                <p className="text-muted-foreground">
                  Add your company details, financials, management info, and supporting documents through an intuitive interface.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                  <span className="font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Complete DRHP Sections
                </h3>
                <p className="text-muted-foreground">
                  Work through 12 structured DRHP workstreams. Track progress, identify gaps, and manage issues in real-time.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                  <span className="font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Generate Review-Ready DRHP
                </h3>
                <p className="text-muted-foreground">
                  Export a comprehensive DRHP preview with all evidence, cross-references, and merchant banker comments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
          Benefits
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-3">
            <CheckCircle2 size={24} className="text-success flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Comprehensive Organization</h3>
              <p className="text-muted-foreground">
                Keep all company information, evidence, and documents in one centralized location.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Zap size={24} className="text-warning flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Faster Preparation</h3>
              <p className="text-muted-foreground">
                Structured workflows help you move through DRHP sections efficiently.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <BarChart3 size={24} className="text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Progress Visibility</h3>
              <p className="text-muted-foreground">
                Real-time dashboards show readiness metrics and identify blocking issues early.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <CheckCircle2 size={24} className="text-success flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Compliance Ready</h3>
              <p className="text-muted-foreground">
                Built on SEBI guidelines for IPO documentation and disclosure requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card border-t border-border py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Prepare Your DRHP?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join SME companies preparing for their IPO journey with Dwaar.
          </p>
          <Link
            href="/role-selection"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity text-lg"
          >
            Get Started Now
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Dwaar DRHP Preparation Platform. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
