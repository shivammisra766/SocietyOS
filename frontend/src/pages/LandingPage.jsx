import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThreeCanvas from '../components/ThreeCanvas';

export default function LandingPage() {
  useEffect(() => {
    // Reveal on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-white/20 overflow-x-hidden">
      {/* 3D Canvas Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <ThreeCanvas />
      </div>

      {/* Navigation Shell */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-[16px] saturate-[180%] border-b border-white/5 transition-all duration-300">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 md:px-12 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="logo-grad"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#404040" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L20.6603 7V17L12 22L3.33975 17V7L12 2Z"
                  fill="url(#logo-grad)"
                />
                <path
                  d="M12 6L17.1962 9V15L12 18L6.80385 15V9L12 6Z"
                  fill="#0A0A0A"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              SocietyOS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              className="text-[14px] text-white/60 hover:text-white transition-colors"
              href="#features"
            >
              Experience
            </a>
            <a
              className="text-[14px] text-white/60 hover:text-white transition-colors"
              href="#how-it-works"
            >
              Features
            </a>
            <a
              className="text-[14px] text-white/60 hover:text-white transition-colors"
              href="#how-it-works"
            >
              Process
            </a>
            <a
              className="text-[14px] text-white/60 hover:text-white transition-colors"
              href="#contact"
            >
              Contact
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-white text-black px-[18px] py-[8px] text-[13px] font-semibold rounded-lg hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            >
              Login
            </Link>
          </div>
          <button className="md:hidden text-white/60">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 px-6 overflow-hidden z-10">
        <div className="text-center max-w-4xl mx-auto z-10 flex flex-col items-center">
          <div className="reveal inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-[13px] font-medium text-white tracking-wide">
              Residential Management · Reimagined
            </span>
          </div>
          <h1 className="reveal text-[clamp(40px,6vw,72px)] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-6">
            Your Society. Secured. Simplified.
          </h1>
          <p className="reveal max-w-[520px] text-[17px] text-white/60 leading-relaxed mb-10 mx-auto">
            SocietyOS replaces paper registers and phone calls with instant
            digital visitor pre-clearance — giving residents control and guards a
            verification tool that works in under 30 seconds.
          </p>
          <div className="reveal flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Link
              to='/login'
              className="bg-white text-black px-8 py-3.5 font-semibold rounded-xl hover:bg-neutral-200 transition-all shadow-[0_4px_24px_rgba(255,255,255,0.1)] cursor-pointer">
              Request Early Access
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center bg-white/5 border border-white/15 text-white px-8 py-3.5 font-medium rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              See How It Works
            </a>
          </div>
          <p className="reveal text-[13px] text-white/35 font-medium">
            Zero unauthorized entries.
          </p>
        </div>
      </section>

      {/* About / Company Section */}
      <section
        className="relative py-24 md:py-32 bg-[#050505] z-10 px-6"
        id="features"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="reveal space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-3 py-1">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                About SocietyOS
              </span>
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold text-white leading-tight tracking-[-0.02em]">
              Built for the way modern societies actually work.
            </h2>
            <div className="space-y-6 text-white/60 text-[16px] leading-relaxed">
              <p>
                We started SocietyOS after watching a security guard spend three
                minutes on the phone just to let in a food delivery — while six
                more visitors waited at the gate.
              </p>
              <p>
                Our platform gives residents a digital key: pre-approve anyone,
                generate a QR code in seconds, and let your household staff
                through automatically every morning without a single call.
              </p>
              <p>
                For society admins, it's a full command centre — entry logs,
                complaints, notices, and resident management from one clean
                dashboard.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <div className="text-3xl font-bold text-white">30s</div>
                <div className="text-[11px] uppercase tracking-wider text-white/30 mt-1">
                  Average Entry
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">80%</div>
                <div className="text-[11px] uppercase tracking-wider text-white/30 mt-1">
                  No Guard Calls
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">0</div>
                <div className="text-[11px] uppercase tracking-wider text-white/30 mt-1">
                  Unauthorized
                </div>
              </div>
            </div>
          </div>
          <div className="reveal grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: 'shield',
                title: 'Visitor Pre-Clearance',
                desc: 'Generate QR passes for guests, deliveries, and cabs. Share via WhatsApp. Entry in under 30 seconds.',
              },
              {
                icon: 'sync',
                title: 'Recurring Staff Passes',
                desc: "Set fixed schedules for maids, cooks, and drivers. They walk in automatically during approved hours.",
              },
              {
                icon: 'notifications_active',
                title: 'Live Entry Approval',
                desc: 'Unexpected visitor? Get a real-time notification and approve or deny entry from your phone in one tap.',
              },
              {
                icon: 'bar_chart',
                title: 'Full Admin Control',
                desc: 'Society admins get audit logs, complaint management, and flat registries in one web dashboard.',
              },
            ].map((card) => (
              <div
                key={card.icon}
                className="bg-white/[0.04] border border-white/[0.08] p-7 rounded-[20px] hover:bg-white/[0.07] hover:border-white/[0.14] hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                  <span className="material-symbols-outlined text-white">
                    {card.icon}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-3">
                  {card.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-24 md:py-32 px-6 relative z-10 bg-gradient-to-b from-[#050505] to-[#121212]"
        id="how-it-works"
      >
        <div className="max-w-[900px] mx-auto text-center mb-20">
          <div className="reveal inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-3 py-1 mb-6">
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
              The Process
            </span>
          </div>
          <h2 className="reveal text-4xl font-bold text-white tracking-tight">
            How It Works
          </h2>
        </div>
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-start justify-between gap-12 relative">
          {[
            {
              num: '01',
              title: 'Resident creates a pass',
              desc: "Open the app, fill in your visitor's name and timing, and share the QR code via WhatsApp.",
            },
            {
              num: '02',
              title: 'Visitor arrives at gate',
              desc: 'The guard scans the QR. The system validates it instantly — no calls, no waiting.',
            },
            {
              num: '03',
              title: 'Entry logged automatically',
              desc: 'Every entry is timestamped and stored. Admins see everything. Residents see history.',
            },
          ].map((step, idx) => (
            <div
              key={step.num}
              className="reveal flex-1 text-center md:text-left relative"
            >
              <div className="text-[48px] font-extrabold hero-gradient-text opacity-30 mb-2">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
          {/* Dashed connectors */}
          <div className="hidden md:block absolute top-[40px] left-[30%] w-[10%] border-t border-dashed border-white/10" />
          <div className="hidden md:block absolute top-[40px] left-[63%] w-[10%] border-t border-dashed border-white/10" />
        </div>
      </section>

      {/* Footer */}
      <footer
        className="bg-black py-16 px-6 border-t border-white/5 relative z-10"
        id="contact"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 pb-12">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="logo-grad-footer"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#404040" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L20.6603 7V17L12 22L3.33975 17V7L12 2Z"
                  fill="url(#logo-grad-footer)"
                />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white/90">
              SocietyOS
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[13px] text-white/40 font-medium">
            <a
              className="hover:text-white transition-colors uppercase tracking-widest"
              href="#features"
            >
              Experience
            </a>
            <a
              className="hover:text-white transition-colors uppercase tracking-widest"
              href="#how-it-works"
            >
              Features
            </a>
            <a
              className="hover:text-white transition-colors uppercase tracking-widest"
              href="#how-it-works"
            >
              Process
            </a>
            <a
              className="hover:text-white transition-colors uppercase tracking-widest"
              href="#contact"
            >
              Contact
            </a>
          </div>
          <div className="flex gap-4">
            {/* LinkedIn */}
            <a
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white hover:text-white transition-all text-white/40"
              href="#"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white hover:text-white transition-all text-white/40"
              href="#"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center pt-8 border-t border-white/5">
          <p className="text-[13px] text-white/25 leading-relaxed">
            © 2026 SocietyOS. Elevating Residential Standards. · Built for
            residential communities.
          </p>
        </div>
      </footer>
    </div>
  );
}
