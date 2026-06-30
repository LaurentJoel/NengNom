import './globals.css';
import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Neng-Nom — L\'infrastructure numérique de l\'élevage africain',
  description:
    'Neng-Nom connecte les éleveurs aux vétérinaires, laboratoires mobiles et à une communauté d\'experts — en temps réel, même en zone rurale.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
