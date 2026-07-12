'use client';

import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, BarChart3, Landmark } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#160b58]/90 text-white backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-300 to-fuchsia-400 text-indigo-950 flex items-center justify-center font-black">D</div>
            <div>
              <div className="text-xl font-bold">Dwaar</div>
              <div className="text-[10px] text-violet-200 uppercase tracking-[0.2em]">IPO readiness</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-indigo-950 hover:bg-violet-100">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-12 lg:gap-16 items-center">
            <div className="space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Landmark className="w-4 h-4 text-violet-200" />
                <span className="text-violet-100 text-sm font-medium">SME IPO readiness, simplified</span>
              </div>

              <div className="space-y-5">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Securities Market TechSprint @ GFF 2026</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
                  Navigate your IPO journey with <span className="text-fuchsia-300">confidence.</span>
                </h1>
                <p className="text-lg text-violet-100/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  A guided workspace for SME companies to organize disclosures, complete compliance questionnaires, and prepare a DRHP preview.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-11 px-5 gap-2 bg-white text-indigo-950 hover:bg-violet-100 shadow-lg shadow-black/15">
                    Start Your IPO Journey <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-11 px-5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">Open Demo</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 sm:p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="rounded-2xl bg-white p-6 sm:p-8 text-slate-900">
                <div className="flex items-center justify-between gap-4 mb-7">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-bold">Hackathon edition</p>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Built for GFF 2026</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">D</div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-center min-h-24">
                    <Image src="/brands/gff-2026.webp" alt="Global Fintech Fest 2026" width={360} height={100} className="max-h-16 w-auto object-contain" priority />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center justify-center min-h-20">
                      <Image src="/brands/sebi.png" alt="SEBI" width={104} height={52} className="max-h-12 w-auto object-contain" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center justify-center min-h-20">
                      <Image src="/brands/hackculture.png" alt="HackCulture" width={250} height={48} className="max-h-10 w-auto object-contain" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-700">Innovation in action</span>
                  <span className="text-slate-500">Prototype by Prathamesh Bhamare</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose Dwaar?</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Streamlined Process"
            description="Complete your IPO questionnaire with our intuitive step-by-step interface designed for regulatory compliance."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Compliance Assured"
            description="Built with SEBI guidelines and regulatory requirements to ensure your documentation meets all standards."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Auto-Generated Reports"
            description="Automatically generate DRHP previews with gap analysis to identify missing information."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-card/50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-16">How Dwaar Works</h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Step number={1} title="Register" description="Create your account and set up company profile" />
          <Step number={2} title="Complete Profile" description="Enter detailed company information and financials" />
          <Step number={3} title="Answer Questionnaire" description="Complete 5-section compliance questionnaire" />
          <Step number={4} title="Generate DRHP" description="Export your complete IPO documentation" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Begin Your IPO Journey?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join leading SME companies using Dwaar to streamline their SEBI IPO process.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Get Started Now <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#12094b] py-12 text-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="font-semibold text-white">Made by Prathamesh Bhamare</p>
          <p className="text-sm text-violet-200/75">Built for the Securities Market TechSprint @ GFF 2026</p>
          <p className="text-xs text-violet-200/55">Hackathon prototype for demonstration purposes. Not an official SEBI product.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
