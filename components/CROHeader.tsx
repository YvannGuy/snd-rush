"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function CROHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-white/90 backdrop-blur border-b border-gray-200" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="SND Rush" className="h-8 w-auto" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          <a href="#gear" className="hover:text-black">Notre matériel</a>
          <a href="#usp" className="hover:text-black">Pourquoi nous choisir</a>
          <a href="#faq" className="hover:text-black">FAQ</a>
          <a href="#testimonials" className="hover:text-black">Témoignages</a>
          <a href="#contact" className="hover:text-black">Contact</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAssistantModal'));
            }}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#e27431" }}
          >
            Trouver mon pack idéal
          </button>
        </div>
      </div>
    </header>
  );
}
