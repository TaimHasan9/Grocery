'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { contactSchema } from '@/src/lib/validations';
import { z } from 'zod';

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactValues) => {
    setServerMsg(null);
    setErrorMsg(null);
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Unable to send message.');
      return;
    }
    setServerMsg(data.message);
    reset();
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#14221C]">
          Contact &amp; Help Center
        </h1>
        <p className="text-sm text-[#607067] mt-1">
          Questions about an order, local farm partnerships, or delivery coverage? Reach out anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#114B3C] text-white rounded-3xl p-7 space-y-5">
            <h2 className="text-xl font-bold">Gromuse Support Desk</h2>
            <div className="space-y-4 text-sm text-[#D7E8DF]">
              <p className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#B2F565]" />
                support@gromuse.example
              </p>
              <p className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#B2F565]" />
                +1 (800) 555-0194 (6:00 AM – 11:00 PM)
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#B2F565]" />
                420 Market Street, Suite 210, Downtown Hub
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-7 bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-4"
        >
          <h2 className="text-xl font-bold text-[#14221C]">Send us a message</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-name" className="block text-xs font-semibold mb-1">
                Name
              </label>
              <input
                id="c-name"
                {...register('name')}
                placeholder="Your full name"
                className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="c-email" className="block text-xs font-semibold mb-1">
                Email
              </label>
              <input
                id="c-email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="c-subject" className="block text-xs font-semibold mb-1">
              Subject
            </label>
            <input
              id="c-subject"
              {...register('subject')}
              placeholder="Order inquiry or product feedback"
              className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm"
            />
            {errors.subject && (
              <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="c-msg" className="block text-xs font-semibold mb-1">
              Message
            </label>
            <textarea
              id="c-msg"
              rows={4}
              {...register('message')}
              placeholder="How can our grocery support team help?"
              className="w-full p-4 rounded-xl border border-[#DCE3DE] text-sm"
            />
            {errors.message && (
              <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>
            )}
          </div>

          {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
          {serverMsg && (
            <div className="p-3.5 rounded-xl bg-[#EEF6F0] text-[#114B3C] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {serverMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 h-11 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30] disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
