import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/src/context/StoreContext';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { CartDrawer } from '@/src/components/cart/CartDrawer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gromuse — Fresh Organic Grocery Store & 15-Minute Delivery',
  description:
    'Shop farm-fresh vegetables, orchard fruits, organic dairy, artisan breads, fresh meat, seafood, and eco household essentials delivered to your door in 15 minutes.',
  openGraph: {
    title: 'Gromuse — Fresh Organic Grocery Store & 15-Minute Delivery',
    description:
      'Shop farm-fresh vegetables, orchard fruits, organic dairy, artisan breads, fresh meat, seafood, and eco household essentials.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gromuse — Fresh Organic Grocery Store',
    description: 'We bring the store to your door with 15-minute organic grocery delivery.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#FAFBF9] text-[#14221C] font-sans antialiased flex flex-col"
      >
        <StoreProvider>
          <Header />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
