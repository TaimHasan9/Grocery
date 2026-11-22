import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Gift,
  ShoppingBag,
  ShoppingBasket,
  TicketPercent,
  Truck,
} from 'lucide-react';

const SERVICE_CARDS = [
  {
    title: 'Gromuse Gift vouchers.',
    description: 'Share fresh organic produce with friends and family.',
    href: '/shop',
    icon: TicketPercent,
  },
  {
    title: 'Present a Gift Card',
    description: 'Instant digital grocery credits with zero expiry fees.',
    href: '/cart',
    icon: Gift,
  },
  {
    title: '15-Min Express Checkout',
    description: 'Cash on delivery or fast encrypted card checkout.',
    href: '/checkout',
    icon: CreditCard,
  },
  {
    title: 'Order and Collect',
    description: 'Track your fresh basket live from farm hub to door.',
    href: '/orders',
    icon: ShoppingBag,
  },
];

export function Footer() {
  return (
    <footer className="mt-16">
      {/* Lime Value Proposition Band matching reference video */}
      <section className="bg-[#A8F255] pt-14 pb-12 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14221C] tracking-tight text-balance">
              We always provide you the best in town
            </h2>
            <p className="mt-2.5 text-sm text-[#1F3A2E]/85 leading-relaxed">
              Since 2007 we have been delivering farm-direct produce, organic pantry staples, and frictionless grocery experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group bg-[#114B3C] text-white rounded-3xl p-6 flex flex-col justify-between min-h-[190px] hover:-translate-y-1 transition-transform shadow-sm"
                >
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-white group-hover:text-[#B2F565] transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs text-white/75 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <span className="text-xs font-semibold text-[#B2F565]">
                      Explore →
                    </span>
                    <div className="w-14 h-14 rounded-2xl bg-[#185D4B] border border-[#B2F565]/30 flex items-center justify-center text-[#B2F565]">
                      <Icon className="w-7 h-7 stroke-[1.75]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Soft Sage Footer Directory */}
      <div className="bg-[#EDF5E1] text-[#14221C] pt-14 pb-8 px-4 sm:px-6 lg:px-10 border-t border-[#DCE8CC]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-[#D8E5C7]">
            {/* Brand + Accepted Payments */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#114B3C] text-[#B2F565] flex items-center justify-center">
                  <ShoppingBasket className="w-5 h-5" />
                </span>
                <span className="text-xl font-bold text-[#14221C]">Gromuse</span>
              </Link>
              <p className="mt-4 text-sm text-[#4A5A52] max-w-sm leading-relaxed">
                Sustainably sourced produce, cold-chain dairy, artisanal bakery, and household essentials delivered fresh in 15 minutes.
              </p>
              <div className="mt-6">
                <p className="text-xs font-bold text-[#14221C] mb-2.5">
                  Accepted Payments
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-tight">
                  <span className="px-2.5 py-1 rounded bg-white border border-[#D8E5C7] text-[#1A1F71]">
                    VISA
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#D8E5C7] text-[#EB001B]">
                    Mastercard
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#D8E5C7] text-[#006FCF]">
                    AMEX
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#D8E5C7] text-[#14221C]">
                    Apple Pay
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#D8E5C7] text-[#114B3C] inline-flex items-center gap-1">
                    <Truck className="w-3 h-3" /> COD
                  </span>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <h4 className="text-sm font-bold text-[#14221C] mb-4">Department</h4>
              <ul className="space-y-2.5 text-sm text-[#4A5A52]">
                <li><Link href="/categories/vegetables" className="hover:text-[#114B3C]">Vegetables</Link></li>
                <li><Link href="/categories/fruits" className="hover:text-[#114B3C]">Organic Fruits</Link></li>
                <li><Link href="/categories/snacks-breads" className="hover:text-[#114B3C]">Snacks &amp; Breads</Link></li>
                <li><Link href="/categories/chicken-meat" className="hover:text-[#114B3C]">Chicken &amp; Meat</Link></li>
                <li><Link href="/categories/fish" className="hover:text-[#114B3C]">Fresh Fish</Link></li>
                <li><Link href="/categories/milk-dairy" className="hover:text-[#114B3C]">Milk &amp; Dairy</Link></li>
                <li><Link href="/categories/drinks" className="hover:text-[#114B3C]">Beverages</Link></li>
              </ul>
            </div>

            {/* About Us */}
            <div>
              <h4 className="text-sm font-bold text-[#14221C] mb-4">About us</h4>
              <ul className="space-y-2.5 text-sm text-[#4A5A52]">
                <li><Link href="/about" className="hover:text-[#114B3C]">About Gromuse</Link></li>
                <li><Link href="/shop" className="hover:text-[#114B3C]">All Products</Link></li>
                <li><Link href="/shop?sort=discount" className="hover:text-[#114B3C]">Weekly Offers</Link></li>
                <li><Link href="/admin" className="hover:text-[#114B3C]">Store Admin</Link></li>
                <li><Link href="/contact" className="hover:text-[#114B3C]">Local Suppliers</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-bold text-[#14221C] mb-4">Services</h4>
              <ul className="space-y-2.5 text-sm text-[#4A5A52]">
                <li><Link href="/cart" className="hover:text-[#114B3C]">Shopping Cart</Link></li>
                <li><Link href="/wishlist" className="hover:text-[#114B3C]">Saved Wishlist</Link></li>
                <li><Link href="/checkout" className="hover:text-[#114B3C]">Express Checkout</Link></li>
                <li><Link href="/account" className="hover:text-[#114B3C]">Customer Account</Link></li>
                <li><Link href="/orders" className="hover:text-[#114B3C]">Order Pickup &amp; Status</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-sm font-bold text-[#14221C] mb-4">Help</h4>
              <ul className="space-y-2.5 text-sm text-[#4A5A52]">
                <li><Link href="/faq" className="hover:text-[#114B3C]">Help Center &amp; FAQ</Link></li>
                <li><Link href="/orders" className="hover:text-[#114B3C]">Track Orders</Link></li>
                <li><Link href="/contact" className="hover:text-[#114B3C]">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-[#114B3C]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#114B3C]">Terms &amp; Conditions</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4A5A52]">
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/shop" className="hover:text-[#114B3C] font-medium">Shop Catalog</Link>
              <Link href="/orders" className="hover:text-[#114B3C] font-medium">Track Order</Link>
              <Link href="/faq" className="hover:text-[#114B3C] font-medium">Help Center</Link>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/terms" className="hover:text-[#114B3C]">Terms of Use</Link>
              <Link href="/privacy" className="hover:text-[#114B3C]">Privacy Policy</Link>
              <span>All rights reserved by Gromuse · 2026</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
