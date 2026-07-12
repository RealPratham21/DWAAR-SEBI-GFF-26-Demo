import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider, CompanyProvider, QuestionnaireProvider, DocumentsProvider } from '@/lib/contexts'

export const metadata: Metadata = {
  title: 'Dwaar - SEBI SME IPO Portal',
  description: 'Complete IPO management solution for SME companies',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#24156f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <AuthProvider>
          <CompanyProvider>
            <QuestionnaireProvider>
              <DocumentsProvider>
                {children}
              </DocumentsProvider>
            </QuestionnaireProvider>
          </CompanyProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
