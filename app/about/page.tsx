import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, ShieldCheck, Truck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-12">
      <section className="rounded-[28px] bg-[#114B3C] text-white p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-balance">
            Fresh local groceries, delivered with farm-direct integrity.
          </h1>
          <p className="text-sm sm:text-base text-[#D7E8DF] leading-relaxed max-w-xl">
            Since 2007, Gromuse has partnered directly with regional growers, artisanal bakeries, sustainable fisheries, and family creameries to bring organic pantry essentials from local hubs to your kitchen table in 15 minutes.
          </p>
          <Link
            href="/shop"
            className="inline-flex px-7 py-3 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold hover:bg-[#A3EB52]"
          >
            Explore Fresh Catalog
          </Link>
        </div>
        <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden">
          <Image
            src="/images/hero-grocery-tote.jpg"
            alt="Gromuse fresh produce bag"
            fill
            sizes="480px"
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-7 space-y-3">
          <Leaf className="w-7 h-7 text-[#114B3C]" />
          <h2 className="text-lg font-bold">100% Traceable Produce</h2>
          <p className="text-sm text-[#4A5A52] leading-relaxed">
            Every vegetable, fruit, and dairy bottle is sourced from vetted local farms with transparent harvest standards.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-7 space-y-3">
          <Truck className="w-7 h-7 text-[#114B3C]" />
          <h2 className="text-lg font-bold">15-Minute Micro-Hubs</h2>
          <p className="text-sm text-[#4A5A52] leading-relaxed">
            Temperature-controlled neighborhood fulfillment keeps chilled salmon, organic milk, and crisp greens peak-fresh.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-7 space-y-3">
          <ShieldCheck className="w-7 h-7 text-[#114B3C]" />
          <h2 className="text-lg font-bold">Zero Plastic Waste Pledge</h2>
          <p className="text-sm text-[#4A5A52] leading-relaxed">
            Kraft bakery bags, recyclable glass dairy bottles, and bamboo household care reduce single-use packaging.
          </p>
        </div>
      </section>
    </div>
  );
}
