'use client';

import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';

export function RolePicker() {
  const router = useRouter();

  const roles = [
    {
      id: 'sme',
      label: 'SME / Company',
      description: 'Prepare DRHP documentation for your IPO',
      icon: Building2,
      features: [
        'Complete workstreams and checklists',
        'Manage company information and evidence',
        'Track DRHP progress and readiness',
        'Collaborate with stakeholders',
      ],
    },
    {
      id: 'merchant-banker',
      label: 'Merchant Banker',
      description: 'Review and guide IPO preparation',
      icon: CheckCircle2,
      features: [
        'Review client submissions',
        'Add comments and recommendations',
        'Track multiple company projects',
        'Generate readiness reports',
      ],
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    if (roleId === 'sme') {
      router.push('/register?role=sme');
    } else {
      router.push('/register?role=merchant-banker');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">D</span>
            </div>
            <span className="font-bold text-2xl text-foreground">Dwaar</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Role
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select how you&apos;ll be using Dwaar to tailor your experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="group border border-border rounded-lg p-8 hover:border-accent hover:shadow-lg transition-all cursor-pointer bg-card"
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Icon size={28} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {role.label}
                    </h2>
                    <p className="text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-success" />
                      </div>
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity">
                  Continue as {role.label}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-accent font-semibold hover:underline"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
