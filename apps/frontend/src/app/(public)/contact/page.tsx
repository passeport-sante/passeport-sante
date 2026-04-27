"use client";

import Image from "next/image";
import { useState } from "react";
import { Send, Mail, User, MessageSquare } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Cercles déco */}
      <div className="circle-hero-mauve" />
      <div className="circle-about-green" />

      {/* Hero */}
      <section className="relative z-10 brand-container pt-16 pb-12">
        <h1 className="text-5xl font-black text-gray-900">
          Contacte-<span className="text-brand-green">nous</span>
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl leading-relaxed">
          Tu as une question, une suggestion ou tu veux simplement discuter ? On
          est là pour t&apos;écouter.
        </p>
      </section>

      {/* Contenu 2 colonnes */}
      <section className="relative z-10 brand-container pb-32">
        <div className="grid grid-cols-2 gap-16 items-start">
          {/* ── Formulaire ── */}
          <div className="bg-white rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-10">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center">
                  <Send size={28} className="text-brand-green" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  Message envoyé !
                </h2>
                <p className="text-gray-500">
                  On te répondra dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Prénom */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-bold text-gray-700 flex items-center gap-2"
                  >
                    <User size={14} className="text-brand-green" />
                    Prénom
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Ton prénom"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold text-gray-700 flex items-center gap-2"
                  >
                    <Mail size={14} className="text-brand-green" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="ton@email.com"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-bold text-gray-700 flex items-center gap-2"
                  >
                    <MessageSquare size={14} className="text-brand-green" />
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Écris ton message ici…"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-4 bg-brand-dark-green text-white font-bold rounded-full text-sm shadow-lg hover:opacity-90 transition-opacity"
                >
                  Envoyer le message
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>

          {/* ── Côté droit : mascotte + infos ── */}
          <div className="flex flex-col items-center gap-8 pt-4">
            <Image
              src="/assets/mascotte/mascotte5.png"
              alt="Mascotte contact"
              width={550}
              height={550}
              className="drop-shadow-xl"
            />

            <div className="w-full space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-brand-green" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    contact@passeport-sante.fr
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                  <MessageSquare size={18} className="text-brand-green" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Réponse
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    Sous 48h ouvrées
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
