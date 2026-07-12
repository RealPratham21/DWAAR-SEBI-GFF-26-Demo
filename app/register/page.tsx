'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, companyName);
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold text-primary">Dwaar</div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Begin your SEBI IPO journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                Company Name
              </label>
              <Input
                id="company"
                type="text"
                placeholder="Your Company Ltd."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-muted-foreground">
          <p>Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-card border border-border rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2 text-foreground">What&apos;s Included:</p>
          <ul className="space-y-1">
            <li>✓ Company profile management</li>
            <li>✓ SEBI compliance questionnaire</li>
            <li>✓ Document upload system</li>
            <li>✓ Auto-generated DRHP</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
