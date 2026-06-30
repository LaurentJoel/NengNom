'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Shared section prop types
type NavT = { problem: string; solutions: string; market: string; team: string; login: string; start: string };
type HeroT = { badge: string; h1: string; sub: string; cta1: string; cta2: string; trust: readonly string[] };
type ProblemT = { title: string; sub: string; stats: { val: string; label: string; ctx: string }[] };
type SolutionT = { title: string; sub: string };
type HowT = { title: string; steps: { title: string; desc: string }[] };
type MarketT = { title: string; sub: string; metrics: { label: string; sub: string; val: string }[] };
type BusinessT = { title: string; sub: string; streams: { icon: string; title: string; desc: string; detail: string }[] };
type RoadmapT = { title: string; milestones: { period: string; title: string; desc: string; status: string }[] };
type TeamT = { title: string; members: { name: string; role: string; bio: string }[] };
type ContactT = { title: string; sub: string; labels: { name: string; email: string; message: string }; placeholders: { name: string; email: string; message: string }; btn: string; sent: string; sentSub: string };

import {
  Stethoscope,
  FlaskConical,
  Users,
  ClipboardList,
  BarChart2,
  Bell,
  BookOpen,
  ArrowRight,
  Mail,
  MessageSquare,
  ChevronRight,
  Check,
  Linkedin,
  Globe,
  Send,
} from 'lucide-react';

// ─── Language system ────────────────────────────────────────────────────────

type Lang = 'fr' | 'en';

const T = {
  fr: {
    nav: {
      problem: 'Problématique',
      solutions: 'Solutions',
      market: 'Marché',
      team: 'Équipe',
      login: 'Connexion',
      start: 'Commencer',
    },
    hero: {
      badge: '🌍 AgriTech · Afrique Centrale',
      h1: "L'infrastructure numérique de l'élevage africain",
      sub: "Neng-Nom connecte les éleveurs aux vétérinaires, laboratoires mobiles et à une communauté d'experts — en temps réel, même en zone rurale.",
      cta1: 'Voir la démo',
      cta2: 'Nous contacter',
      trust: ['🐔 Aviculture', '🔬 Labo mobile', '🤖 IA embarquée'],
    },
    problem: {
      title: "Le défi de l'élevage africain",
      sub: "Des obstacles structurels empêchent des millions d'éleveurs d'accéder aux soins vétérinaires essentiels.",
      stats: [
        { val: '72%', label: "Des éleveurs sans accès vétérinaire dans un rayon de 50 km", ctx: 'FAO, Rapport Santé Animale Afrique sub-saharienne, 2024' },
        { val: '48h', label: "Délai moyen pour obtenir un diagnostic de maladie animale", ctx: 'En zone rurale, sans infrastructure numérique adéquate' },
        { val: '30%', label: "De pertes animales annuelles évitables avec un suivi adapté", ctx: 'UA-IBAR, Initiative Santé Animale Afrique Centrale, 2023' },
      ],
    },
    solution: {
      title: 'Une plateforme, 7 solutions',
      sub: 'Conçue pour les réalités du terrain africain',
    },
    howItWorks: {
      title: 'Comment ça marche ?',
      steps: [
        { title: "L'éleveur décrit ses symptômes", desc: "Photo, texte ou message vocal — la saisie est adaptée à tous les niveaux de connectivité et d'alphabétisation numérique." },
        { title: "Routage vers le bon expert", desc: "La plateforme identifie le vétérinaire ou laboratoire selon la spécialisation, la localisation et la disponibilité." },
        { title: "Diagnostic, traitement, suivi", desc: "Ordonnance numérique, rappels automatiques et historique complet — tout centralisé dans une seule application." },
      ],
    },
    market: {
      title: 'Un marché de 600 milliards FCFA',
      sub: 'Afrique Centrale — un marché vétérinaire largement sous-adressé',
      metrics: [
        { label: 'TAM', sub: 'Marché vétérinaire Afrique sub-saharienne', val: '850M USD' },
        { label: 'SAM', sub: 'Afrique Centrale (CM, CG, CD, GA)', val: '120M USD' },
        { label: 'SOM', sub: 'Objectif 3 ans — Cameroun + Congo', val: '8M USD' },
      ],
    },
    business: {
      title: 'Modèle économique multi-flux',
      sub: "Revenus diversifiés, adaptés au pouvoir d'achat local",
      streams: [
        { icon: '💬', title: 'Consultations', desc: 'Paiement par acte', detail: '2 000 – 15 000 FCFA / consultation' },
        { icon: '📦', title: 'Abonnement', desc: 'Plan mensuel éleveur', detail: '5 000 FCFA / mois — accès complet' },
        { icon: '🔬', title: 'Commission Lab', desc: '15% sur chaque test', detail: 'Sur chaque test commandé via la plateforme' },
        { icon: '🛒', title: 'Marketplace', desc: 'Produits vétérinaires', detail: 'Lancement prévu Q4 2027' },
      ],
    },
    roadmap: {
      title: 'Notre trajectoire',
      milestones: [
        { period: 'Q3 2026', title: 'MVP · Lancement Cameroun', desc: '100 éleveurs pilotes · Consultations + Labo mobile', status: 'current' },
        { period: 'Q4 2026', title: 'Labo mobile opérationnel', desc: '500 éleveurs · Expansion Littoral & Centre', status: 'upcoming' },
        { period: 'Q1 2027', title: 'Congo Brazzaville', desc: 'App mobile React Native · Partenariat ONG', status: 'upcoming' },
        { period: 'Q2 2027', title: 'Gabon + Kinshasa · Series A', desc: '5 000 éleveurs · Levée de fonds Series A', status: 'future' },
      ],
    },
    team: {
      title: "L'équipe fondatrice",
      members: [
        { name: 'Fodieng Emmanuel', role: 'Co-fondateur & CEO', bio: "Entrepreneur AgriTech, 8 ans d'expérience en élevage avicole au Cameroun. MBA Business Africa." },
        { name: 'Mkounga Joel', role: 'Co-fondateur & CTO', bio: 'Ingénieur logiciel senior, spécialisé en systèmes distribués et applications mobiles pour marchés émergents.' },
      ],
    },
    contact: {
      title: 'Intéressé par Neng-Nom ?',
      sub: "Rejoignez-nous en tant qu'investisseur, partenaire ou conseiller.",
      labels: { name: 'Nom', email: 'Email', message: 'Message' },
      placeholders: { name: 'Votre nom', email: 'votre@email.com', message: 'Décrivez votre intérêt ou votre proposition...' },
      btn: 'Envoyer le message',
      sent: "Message envoyé !",
      sentSub: 'Nous vous répondrons dans les 24 heures.',
    },
    footer: "L'infrastructure numérique de l'élevage africain. Douala, Cameroun.",
  },
  en: {
    nav: {
      problem: 'Problem',
      solutions: 'Solutions',
      market: 'Market',
      team: 'Team',
      login: 'Sign in',
      start: 'Get started',
    },
    hero: {
      badge: '🌍 AgriTech · Central Africa',
      h1: 'The digital infrastructure for African livestock farming',
      sub: "Neng-Nom connects farmers with veterinarians, mobile labs and a community of experts — in real time, even in rural areas.",
      cta1: 'View demo',
      cta2: 'Contact us',
      trust: ['🐔 Poultry', '🔬 Mobile lab', '🤖 Embedded AI'],
    },
    problem: {
      title: 'The challenge of African livestock farming',
      sub: 'Structural barriers prevent millions of farmers from accessing essential veterinary care.',
      stats: [
        { val: '72%', label: 'Of farmers have no access to a vet within 50 km', ctx: 'FAO, Animal Health Report Sub-Saharan Africa, 2024' },
        { val: '48h', label: 'Average delay to obtain an animal disease diagnosis', ctx: 'In rural areas, without adequate digital infrastructure' },
        { val: '30%', label: 'Of annual animal losses preventable with proper monitoring', ctx: 'AU-IBAR, Central Africa Animal Health Initiative, 2023' },
      ],
    },
    solution: {
      title: 'One platform, 7 solutions',
      sub: 'Designed for the realities of African fieldwork',
    },
    howItWorks: {
      title: 'How does it work?',
      steps: [
        { title: 'Farmer describes symptoms', desc: 'Photo, text or voice message — input adapted for all connectivity levels and digital literacy.' },
        { title: 'Routing to the right expert', desc: 'The platform identifies the right vet or lab based on specialization, location and availability.' },
        { title: 'Diagnosis, treatment, follow-up', desc: 'Digital prescription, automatic reminders and complete history — all centralized in one app.' },
      ],
    },
    market: {
      title: 'A $120M+ SAM opportunity',
      sub: 'Central Africa — a vastly underserved veterinary market',
      metrics: [
        { label: 'TAM', sub: 'Veterinary market Sub-Saharan Africa', val: '$850M USD' },
        { label: 'SAM', sub: 'Central Africa (CM, CG, CD, GA)', val: '$120M USD' },
        { label: 'SOM', sub: '3-year target — Cameroon + Congo', val: '$8M USD' },
      ],
    },
    business: {
      title: 'Multi-stream business model',
      sub: 'Diversified revenue adapted to local purchasing power',
      streams: [
        { icon: '💬', title: 'Consultations', desc: 'Pay-per-act', detail: '2,000 – 15,000 FCFA / consultation' },
        { icon: '📦', title: 'Subscription', desc: 'Monthly farmer plan', detail: '5,000 FCFA / month — full access' },
        { icon: '🔬', title: 'Lab commission', desc: '15% per test ordered', detail: 'On every test ordered through the platform' },
        { icon: '🛒', title: 'Marketplace', desc: 'Vet products', detail: 'Planned launch Q4 2027' },
      ],
    },
    roadmap: {
      title: 'Our roadmap',
      milestones: [
        { period: 'Q3 2026', title: 'MVP · Cameroon launch', desc: '100 pilot farmers · Consultations + mobile lab', status: 'current' },
        { period: 'Q4 2026', title: 'Mobile lab operational', desc: '500 farmers · Expansion Littoral & Centre', status: 'upcoming' },
        { period: 'Q1 2027', title: 'Congo Brazzaville', desc: 'React Native mobile app · NGO partnership', status: 'upcoming' },
        { period: 'Q2 2027', title: 'Gabon + Kinshasa · Series A', desc: '5,000 farmers · Series A fundraising', status: 'future' },
      ],
    },
    team: {
      title: 'The founding team',
      members: [
        { name: 'Fodieng Emmanuel', role: 'Co-founder & CEO', bio: 'AgriTech entrepreneur, 8 years of experience in poultry farming in Cameroon. MBA Business Africa.' },
        { name: 'Mkounga Joel', role: 'Co-founder & CTO', bio: 'Senior software engineer specialized in distributed systems and mobile applications for emerging markets.' },
      ],
    },
    contact: {
      title: 'Interested in Neng-Nom?',
      sub: 'Join us as an investor, partner or advisor.',
      labels: { name: 'Name', email: 'Email', message: 'Message' },
      placeholders: { name: 'Your name', email: 'your@email.com', message: 'Describe your interest or proposal...' },
      btn: 'Send message',
      sent: 'Message sent!',
      sentSub: "We'll get back to you within 24 hours.",
    },
    footer: 'The digital infrastructure for African livestock farming. Douala, Cameroon.',
  },
};

// ─── Main export ────────────────────────────────────────────────────────────

export function LandingPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = T[lang];

  return (
    <div className="bg-sand-100 min-h-screen">
      <LandingNav lang={lang} setLang={setLang} t={t.nav} />
      <HeroSection t={t.hero} lang={lang} />
      <ProblemSection t={t.problem} />
      <SolutionSection t={t.solution} lang={lang} />
      <HowItWorksSection t={t.howItWorks} />
      <MarketSection t={t.market} />
      <BusinessModelSection t={t.business} />
      <RoadmapSection t={t.roadmap} />
      <TeamSection t={t.team} />
      <ContactSection t={t.contact} />
      <LandingFooter text={t.footer} />
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function LandingNav({
  lang,
  setLang,
  t,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: NavT;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-sand-200/60 shadow-elevation-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="content-container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 icon-gradient-bg rounded-xl flex items-center justify-center shadow-elevation-sm group-hover:shadow-glow-brand transition-shadow duration-300">
            <Stethoscope size={16} className="text-white" />
          </div>
          <span className="font-heading font-bold text-brand-900 text-lg tracking-tight">
            Neng‑Nom
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {[
            { label: t.problem, href: '#problematique' },
            { label: t.solutions, href: '#solutions' },
            { label: t.market, href: '#marche' },
            { label: t.team, href: '#equipe' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-brand-800 hover:bg-brand-50/60 rounded-lg transition-all duration-200"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 border border-sand-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-brand-400 hover:shadow-elevation-sm transition-all duration-200 cursor-pointer"
          >
            <Globe size={12} />
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>

          <Link
            href="/auth/login"
            className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 hover:text-brand-800 transition-all duration-200 rounded-lg hover:bg-brand-50"
          >
            {t.login}
          </Link>
          <Link
            href="/auth/register"
            className="btn-gradient"
          >
            {t.start}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroSection({ t, lang }: { t: HeroT; lang: Lang }) {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveScreen((p) => (p + 1) % 3), 3200);
    return () => clearInterval(interval);
  }, []);

  const screens = [<DashboardScreen key="d" />, <ChatScreen key="c" />, <LabScreen key="l" />];

  return (
    <section className="min-h-screen flex items-center pt-16 overflow-hidden relative">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 hero-gradient-mesh" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-50/40 to-transparent pointer-events-none" />

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 gradient-orb bg-brand-400/20" />
      <div className="absolute bottom-32 right-[5%] w-96 h-96 gradient-orb bg-amber-600/10" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] gradient-orb bg-brand-200/15" style={{ animationDelay: '-4s' }} />

      <div className="content-container relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center py-20 lg:py-24">
          {/* Left */}
          <div className="space-y-7 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-brand-200 rounded-full shadow-elevation-sm animate-fade-in">
              <span className="relative inline-flex">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-brand-700 tracking-wide">{t.badge}</span>
            </div>

            <h1 className="font-heading font-bold text-[2.75rem] md:text-5xl xl:text-[3.5rem] leading-[1.08] text-balance animate-fade-in animate-stagger-1 gradient-heading">
              {t.h1}
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-[480px] animate-fade-in animate-stagger-2">
              {t.sub}
            </p>

            <div className="flex flex-wrap gap-3 pt-1 animate-fade-in animate-stagger-3">
              <Link
                href="/auth/register"
                className="btn-gradient group"
              >
                {t.cta1}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <a
                href="#contact"
                className="btn-secondary"
              >
                {t.cta2}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 animate-fade-in animate-stagger-4">
              {t.trust.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/90 backdrop-blur-sm border border-sand-200 rounded-full text-xs font-medium text-neutral-600 shadow-elevation-sm hover:shadow-elevation-md hover:-translate-y-0.5 transition-all duration-250"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — phone mockup with glow */}
          <div className="flex items-center justify-center animate-fade-in animate-stagger-3">
            <div className="relative">
              {/* Multi-layer glow behind phone */}
              <div className="absolute inset-[-30px] bg-gradient-to-br from-brand-400/20 via-brand-600/10 to-amber-600/10 rounded-[70px] blur-3xl animate-glow-pulse" />
              <div className="absolute inset-[-15px] bg-brand-400/10 rounded-[55px] blur-xl" />

              {/* Phone outer */}
              <div className="relative w-[280px] h-[572px] animate-float-slow">
                <div className="absolute inset-0 bg-neutral-900 rounded-[46px] shadow-elevation-lg border-[3px] border-neutral-700/80" />
                {/* Notch */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-neutral-900 rounded-full z-20 border border-neutral-700" />
                {/* Screen */}
                <div className="absolute inset-[5px] bg-white rounded-[42px] overflow-hidden shadow-inner">
                  {screens.map((screen, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        activeScreen === i ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
                      }`}
                    >
                      {screen}
                    </div>
                  ))}
                </div>
                {/* Side buttons */}
                <div className="absolute right-[-3px] top-24 w-1 h-10 bg-neutral-700 rounded-r-full" />
                <div className="absolute left-[-3px] top-20 w-1 h-8 bg-neutral-700 rounded-l-full" />
                <div className="absolute left-[-3px] top-32 w-1 h-8 bg-neutral-700 rounded-l-full" />
              </div>

              {/* Screen indicator dots */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setActiveScreen(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeScreen === i ? 'bg-brand-700 w-6 shadow-glow-brand' : 'bg-sand-300 w-2 hover:bg-brand-400 hover:w-3'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Mock phone screens

function DashboardScreen() {
  return (
    <div className="h-full bg-sand-100 flex flex-col overflow-hidden">
      <div className="bg-brand-800 px-4 pt-10 pb-5">
        <p className="text-brand-400 text-[11px] mb-0.5">Bonjour 👋</p>
        <p className="text-white font-semibold text-sm leading-tight">Emmanuel Fodieng</p>
        <p className="text-brand-400 text-[11px] mt-0.5">Ferme Avicole du Wouri</p>
      </div>
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">✨ Suggestion du jour</p>
          <p className="text-[11px] text-neutral-700 mt-1 leading-relaxed">Risque Newcastle — vérifiez votre calendrier vaccinal.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Effectif', val: '2 450', icon: '🐔', sub: '+12 sem.' },
            { label: 'Mortalité', val: '3', icon: '⚠️', sub: 'Cette sem.', red: true },
            { label: 'Consultation', val: '1 active', icon: '💬', sub: 'En cours', blue: true },
            { label: 'Vaccin', val: 'Dans 7j', icon: '💉', sub: '15 juin', amber: true },
          ].map((s) => (
            <div key={s.label} className={`bg-white border rounded-xl p-2.5 ${s.red ? 'border-red-100' : s.amber ? 'border-amber-100' : 'border-sand-200'}`}>
              <p className="text-sm leading-none">{s.icon}</p>
              <p className={`text-xs font-bold mt-1.5 ${s.red ? 'text-red-500' : s.amber ? 'text-amber-600' : s.blue ? 'text-blue-600' : 'text-neutral-900'}`}>{s.val}</p>
              <p className="text-neutral-400 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatScreen() {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="bg-brand-800 px-4 pt-10 pb-3 flex items-center gap-3">
        <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">AD</div>
        <div>
          <p className="text-white text-xs font-semibold">Dr. Aminata Diallo</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <p className="text-brand-400 text-[10px]">En ligne</p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <div className="flex justify-end">
          <div className="bg-brand-50 border border-brand-100 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
            <p className="text-[11px] text-neutral-800 leading-relaxed">Plusieurs poulets toussent depuis ce matin...</p>
            <p className="text-neutral-400 text-[9px] mt-1 text-right">10:24</p>
          </div>
        </div>
        <div className="flex">
          <div className="bg-white border border-sand-200 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-[11px] text-neutral-800 leading-relaxed">Envoyez une photo et la date de la dernière vaccination.</p>
            <p className="text-neutral-400 text-[9px] mt-1">10:26</p>
          </div>
        </div>
        <div className="flex">
          <div className="bg-amber-50 border border-amber-200 rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%]">
            <p className="text-[10px] font-bold text-amber-700">📋 Prescription</p>
            <p className="text-[11px] text-neutral-700 mt-0.5 leading-relaxed">Isolez les sujets. Rappel vaccinal Newcastle urgent.</p>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-sand-200">
        <div className="flex gap-2 items-center bg-sand-100 rounded-xl px-3 py-2">
          <p className="text-[11px] text-neutral-400 flex-1">Votre message...</p>
          <div className="w-6 h-6 bg-brand-800 rounded-lg flex items-center justify-center">
            <ArrowRight size={11} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LabScreen() {
  const steps = [
    { label: 'Demande reçue', done: true },
    { label: 'Planifiée', done: true },
    { label: 'Technicien en route', active: true },
    { label: 'Échantillons collectés' },
    { label: 'Analyse en cours' },
    { label: 'Résultats prêts' },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="bg-brand-800 px-4 pt-10 pb-3">
        <p className="text-brand-400 text-[10px]">Demande #LAB-001</p>
        <p className="text-white font-semibold text-xs mt-0.5">Diagnostic de maladies</p>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? 'bg-brand-600' : step.active ? 'bg-brand-800 ring-2 ring-brand-400 ring-offset-1' : 'bg-sand-200'
              }`}>
                {step.done ? <Check size={10} className="text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/50" />}
              </div>
              <p className={`text-[11px] flex-1 ${step.active ? 'font-semibold text-brand-800' : step.done ? 'text-neutral-400 line-through' : 'text-neutral-400'}`}>
                {step.label}
              </p>
              {step.active && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">En cours</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-brand-700">Arrivée estimée</p>
          <p className="text-sm font-bold text-brand-900 mt-0.5">14h30 — Dans 2h</p>
        </div>
      </div>
    </div>
  );
}

// ─── Problem ─────────────────────────────────────────────────────────────────

function ProblemSection({ t }: { t: ProblemT }) {
  return (
    <section id="problematique" className="section-gap bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 gradient-orb bg-red-200/10" style={{ animationDelay: '-1s' }} />
      <div className="content-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-900">{t.title}</h2>
          <p className="text-neutral-600 mt-4 max-w-lg mx-auto leading-relaxed text-lg">{t.sub}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {t.stats.map((stat, i) => (
            <div
              key={stat.val}
              className="group border border-sand-200 rounded-2xl p-8 hover:border-brand-400/60 hover:shadow-elevation-md hover:-translate-y-1 transition-all duration-250 cursor-default bg-white relative overflow-hidden stripe-accent"
            >
              <div className="text-[3.5rem] font-bold font-heading leading-none mb-4 stat-gradient">{stat.val}</div>
              <p className="text-base text-neutral-900 font-semibold leading-snug mb-3">{stat.label}</p>
              <p className="text-xs text-neutral-400 leading-relaxed border-t border-sand-200 pt-3 group-hover:text-neutral-500 transition-colors">{stat.ctx}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution pillars ─────────────────────────────────────────────────────────

const PILLARS_FR = [
  { icon: <Stethoscope size={28} />, title: 'Consultation Expert', desc: 'Chat · Voix · Vidéo · Urgence', features: ['Chat texte et photos', 'Appels voix et vidéo', 'Mode urgence 24/7', 'Prescription numérique', 'Historique médical'] },
  { icon: <FlaskConical size={28} />, title: 'Labo Mobile', desc: 'Technicien à domicile · Résultats in-app', features: ['Prise RDV en ligne', 'Technicien géolocalisé', 'Suivi en temps réel', 'Résultats dans l\'app', '6 types de tests'] },
  { icon: <Users size={28} />, title: 'Communauté', desc: 'Groupes régionaux · Alertes épidémiques', features: ['Forums par région', 'Alertes sanitaires géo.', 'Partage d\'expériences', 'Mode anonyme', 'Marketplace éleveurs'] },
  { icon: <ClipboardList size={28} />, title: 'Dossiers Ferme', desc: 'Mortalité · Vaccins · Dépenses', features: ['Enregistrement quotidien', 'Historique traitements', 'Suivi dépenses', 'Rapports auto.', 'Export PDF/CSV'] },
  { icon: <BarChart2 size={28} />, title: 'Surveillance', desc: 'Détection foyers · Dashboard épidémies', features: ['Détection précoce', 'Carte épidémiologique', 'Alertes préventives', 'Analyse tendances', 'Interface officielle'] },
  { icon: <Bell size={28} />, title: 'Rappels Vaccins', desc: 'Calendriers automatisés', features: ['Calendrier personnalisé', 'SMS + push', 'Rappels vermifugation', 'Multi-élevages', 'Alertes stock vaccins'] },
  { icon: <BookOpen size={28} />, title: 'Base de Connaissances', desc: 'Guides · Vidéos · Bonnes pratiques', features: ['Guides maladies', 'Vidéos formation', 'Fiches techniques', 'Contenu en français', 'Mode hors-ligne'] },
];

const PILLARS_EN = [
  { icon: <Stethoscope size={28} />, title: 'Expert Consultation', desc: 'Chat · Voice · Video · Emergency', features: ['Text & photo chat', 'Voice & video calls', '24/7 emergency mode', 'Digital prescription', 'Medical history'] },
  { icon: <FlaskConical size={28} />, title: 'Mobile Lab', desc: 'Home technician · Results in-app', features: ['Online booking', 'Geolocated technician', 'Real-time tracking', 'Results in the app', '6 test types'] },
  { icon: <Users size={28} />, title: 'Community', desc: 'Regional groups · Epidemic alerts', features: ['Regional forums', 'Geo disease alerts', 'Experience sharing', 'Anonymous mode', 'Farmer marketplace'] },
  { icon: <ClipboardList size={28} />, title: 'Farm Records', desc: 'Mortality · Vaccines · Expenses', features: ['Daily recording', 'Treatment history', 'Expense tracking', 'Auto reports', 'PDF/CSV export'] },
  { icon: <BarChart2 size={28} />, title: 'Surveillance', desc: 'Outbreak detection · Epidemic dashboard', features: ['Early detection', 'Epidemio. map', 'Preventive alerts', 'Trend analysis', 'Official interface'] },
  { icon: <Bell size={28} />, title: 'Vaccine Reminders', desc: 'Automated schedules', features: ['Custom schedule', 'SMS + push', 'Deworming reminders', 'Multi-farm', 'Stock alerts'] },
  { icon: <BookOpen size={28} />, title: 'Knowledge Base', desc: 'Guides · Videos · Best practices', features: ['Disease guides', 'Training videos', 'Technical sheets', 'French content', 'Offline mode'] },
];

function SolutionSection({ t, lang }: { t: SolutionT; lang: Lang }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const pillars = lang === 'fr' ? PILLARS_FR : PILLARS_EN;

  return (
    <section id="solutions" className="section-gap bg-sand-100 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-80 h-80 gradient-orb bg-brand-300/10" style={{ animationDelay: '-3s' }} />
      <div className="content-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-900">{t.title}</h2>
          <p className="text-neutral-600 mt-3 text-lg">{t.sub}</p>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className={`group border rounded-2xl p-5 cursor-pointer transition-all duration-250 ${
                expanded === i
                  ? 'border-brand-500 bg-white shadow-elevation-md col-span-2 -translate-y-1'
                  : 'border-sand-200 bg-white hover:border-brand-400/60 hover:shadow-elevation-sm hover:-translate-y-0.5'
              }`}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="text-brand-700 mb-3 group-hover:scale-110 transition-transform duration-200 origin-left">{pillar.icon}</div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900">{pillar.title}</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{pillar.desc}</p>
              {expanded === i && (
                <ul className="mt-4 space-y-1.5 border-t border-sand-100 pt-4 animate-fade-in">
                  {pillar.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 hover:translate-x-1 transition-transform duration-150">
                      <span className="w-4 h-4 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-brand-700" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Mobile scroll */}
        <div className="flex md:hidden overflow-x-auto gap-3 pb-4 snap-x -mx-6 px-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-56 border border-sand-200 bg-white rounded-2xl p-5 snap-start cursor-pointer shadow-elevation-sm hover:shadow-elevation-md hover:-translate-y-0.5 transition-all duration-250"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="text-brand-700 mb-3">{pillar.icon}</div>
              <h3 className="font-semibold text-sm text-neutral-900">{pillar.title}</h3>
              <p className="text-xs text-neutral-500 mt-1">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection({ t }: { t: HowT }) {
  const icons = [<MessageSquare size={22} key="1" />, <ChevronRight size={22} key="2" />, <Check size={22} key="3" />];

  return (
    <section className="section-gap bg-white">
      <div className="content-container">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-900">{t.title}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] border-t-2 border-dashed border-brand-200" />

          {t.steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center relative group">
              <div className="relative mb-7">
                <div className="w-24 h-24 icon-gradient-bg rounded-2xl flex items-center justify-center text-white shadow-elevation-md group-hover:shadow-elevation-lg group-hover:scale-105 transition-all duration-250">
                  {icons[i]}
                </div>
                <span className="absolute -top-2.5 -right-2.5 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-elevation-sm">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Market + proper Africa map ───────────────────────────────────────────────

function MarketSection({ t }: { t: MarketT }) {
  return (
    <section id="marche" className="section-gap bg-sand-100">
      <div className="content-container">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-3xl text-brand-900">{t.title}</h2>
          <p className="text-neutral-600 mt-4 max-w-lg mx-auto">{t.sub}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Metrics */}
          <div className="space-y-4">
            {t.metrics.map((m, i) => (
              <div key={m.label} className="bg-white border border-sand-200 rounded-2xl p-5 flex items-start gap-4 hover:border-brand-300 transition-colors">
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold text-sm ${
                  i === 0 ? 'bg-brand-900 text-white' : i === 1 ? 'bg-brand-700 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {m.label}
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-900 font-heading leading-none">{m.val}</p>
                  <p className="text-sm text-neutral-600 mt-1.5 leading-snug">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Proper Africa map */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <CentralAfricaMap />
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                { label: 'Cameroun', color: 'bg-brand-700' },
                { label: 'Congo Brazzaville', color: 'bg-brand-600' },
                { label: 'Congo Kinshasa', color: 'bg-brand-500' },
                { label: 'Gabon', color: 'bg-brand-400' },
              ].map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-sand-100 border border-sand-200 px-2.5 py-1.5 rounded-full">
                  <span className={`w-2 h-2 ${c.color} rounded-full`} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CentralAfricaMap() {
  return (
    <svg viewBox="0 0 440 380" className="w-full h-auto" fill="none">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#1B4332" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Light Africa continent silhouette context */}
      <path
        d="M 55,20 L 200,10 L 280,25 L 340,60 L 380,110 L 410,170 L 420,230 L 400,300 L 360,350 L 300,375 L 240,375 L 180,360 L 130,320 L 90,270 L 60,210 L 40,150 L 45,90 Z"
        fill="#F5F0E8"
        stroke="#D4C9B8"
        strokeWidth="1.5"
      />

      {/* === CAMEROON (CM) — distinctive elongated shape, wider south ===
          Position: left-center area, north-south elongated
          Approx SVG coords mapping real geography */}
      <path
        d="M 95,68
           L 130,62
           L 168,70
           L 195,85
           L 200,100
           L 190,115
           L 178,130
           L 182,145
           L 170,165
           L 150,178
           L 128,180
           L 108,168
           L 95,145
           L 82,120
           L 78,95
           Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.2"
        filter="url(#shadow)"
      />
      {/* CM city dot - Yaoundé */}
      <circle cx="145" cy="155" r="3.5" fill="white" stroke="#1B4332" strokeWidth="1.5" />
      <text x="152" y="159" fontSize="9" fill="#0D2B1A" fontWeight="600">Yaoundé</text>

      {/* === GABON (GA) — south of Cameroon, compact ===
          Smaller country, roughly square-ish */}
      <path
        d="M 95,185
           L 128,182
           L 140,195
           L 138,225
           L 128,248
           L 108,255
           L 88,245
           L 80,225
           L 82,200
           Z"
        fill="#40916C"
        stroke="#2D6A4F"
        strokeWidth="1.2"
        filter="url(#shadow)"
      />
      {/* GA city dot - Libreville */}
      <circle cx="98" cy="208" r="3" fill="white" stroke="#2D6A4F" strokeWidth="1.2" />
      <text x="105" y="212" fontSize="8.5" fill="#0D2B1A" fontWeight="600">Libreville</text>

      {/* === CONGO BRAZZAVILLE (CG) — east of Gabon, elongated N-S ===
          Has a distinctive shape - wider in south, narrower access to coast */}
      <path
        d="M 140,168
           L 170,168
           L 195,180
           L 205,200
           L 210,225
           L 202,255
           L 188,275
           L 165,282
           L 140,272
           L 130,250
           L 138,225
           L 140,195
           Z"
        fill="#52B788"
        stroke="#40916C"
        strokeWidth="1.2"
        filter="url(#shadow)"
      />
      {/* CG city dot - Brazzaville */}
      <circle cx="175" cy="260" r="3" fill="white" stroke="#40916C" strokeWidth="1.2" />
      <text x="182" y="264" fontSize="8.5" fill="#0D2B1A" fontWeight="600">Brazzaville</text>

      {/* === DRC / CONGO KINSHASA (CD) — very large, dominant ===
          Much larger than the others — takes up right half */}
      <path
        d="M 195,85
           L 265,75
           L 320,80
           L 365,105
           L 385,145
           L 395,190
           L 385,235
           L 365,270
           L 340,298
           L 295,318
           L 250,322
           L 215,305
           L 200,280
           L 188,275
           L 202,255
           L 210,225
           L 205,200
           L 195,180
           L 170,168
           L 178,145
           L 182,130
           L 190,115
           L 200,100
           Z"
        fill="#74C69D"
        stroke="#52B788"
        strokeWidth="1.2"
        filter="url(#shadow)"
      />
      {/* CD city dot - Kinshasa */}
      <circle cx="198" cy="283" r="3.5" fill="white" stroke="#52B788" strokeWidth="1.5" />
      <text x="206" y="288" fontSize="9" fill="#0D2B1A" fontWeight="600">Kinshasa</text>

      {/* Phase 1 marker - Cameroon */}
      <circle cx="130" cy="120" r="6" fill="#D4831A" stroke="white" strokeWidth="1.5" />
      <text x="140" y="125" fontSize="9.5" fill="#D4831A" fontWeight="700">Phase 1</text>

      {/* Legend box */}
      <rect x="6" y="330" width="200" height="36" rx="8" fill="white" stroke="#EDE7DC" strokeWidth="1" />
      <circle cx="20" cy="344" r="4" fill="#D4831A" />
      <text x="28" y="348" fontSize="9" fill="#4B5563">Phase 1 : Cameroun · Congo Brazza.</text>
      <text x="28" y="359" fontSize="9" fill="#9CA3AF">Phase 2 : RD Congo · Gabon (2027)</text>
    </svg>
  );
}

// ─── Business model ───────────────────────────────────────────────────────────

function BusinessModelSection({ t }: { t: BusinessT }) {
  return (
    <section className="section-gap bg-white">
      <div className="content-container">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-900">{t.title}</h2>
          <p className="text-neutral-600 mt-3 text-lg">{t.sub}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {t.streams.map((s) => (
            <div
              key={s.title}
              className="group bg-white border border-sand-200 rounded-2xl p-6 hover:border-brand-400/60 hover:shadow-elevation-md hover:-translate-y-1 transition-all duration-250 cursor-default"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">{s.icon}</div>
              <h3 className="font-heading font-semibold text-base text-neutral-900 mb-1">{s.title}</h3>
              <p className="text-sm text-neutral-600 mb-3">{s.desc}</p>
              <p className="text-xs text-neutral-400 border-t border-sand-100 pt-3 group-hover:text-neutral-500 transition-colors">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

function RoadmapSection({ t }: { t: RoadmapT }) {
  return (
    <section className="section-gap bg-sand-100">
      <div className="content-container">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-3xl text-brand-900">{t.title}</h2>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-5 left-0 right-0 border-t-2 border-sand-200" />
          <div className="grid md:grid-cols-4 gap-8">
            {t.milestones.map((m, i) => (
              <div key={i} className="relative flex flex-col">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-4 relative z-10 bg-white ${
                  m.status === 'current' ? 'border-brand-800 bg-brand-800' : m.status === 'upcoming' ? 'border-brand-600' : 'border-sand-300'
                }`}>
                  {m.status === 'current' ? (
                    <span className="w-3.5 h-3.5 bg-white rounded-full" />
                  ) : (
                    <span className={`w-3 h-3 rounded-full ${m.status === 'upcoming' ? 'bg-brand-500' : 'bg-sand-300'}`} />
                  )}
                </div>
                <span className={`inline-block self-start px-2.5 py-0.5 text-xs font-semibold rounded-full mb-2 ${
                  m.status === 'current' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sand-200 text-neutral-600'
                }`}>
                  {m.period}
                </span>
                <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">{m.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────

function TeamSection({ t }: { t: TeamT }) {
  return (
    <section id="equipe" className="section-gap bg-white">
      <div className="content-container">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-900">{t.title}</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {t.members.map((m) => (
            <div key={m.name} className="group bg-brand-50 border border-brand-100 rounded-2xl p-7 max-w-xs w-full hover:shadow-elevation-md hover:-translate-y-1 hover:border-brand-300 transition-all duration-250">
              <div className="w-16 h-16 icon-gradient-bg rounded-2xl flex items-center justify-center text-white text-xl font-bold font-heading mb-5 shadow-elevation-sm group-hover:shadow-glow-brand group-hover:scale-105 transition-all duration-250">
                {m.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <h3 className="font-heading font-semibold text-base text-neutral-900">{m.name}</h3>
              <p className="text-sm text-brand-700 font-semibold mt-0.5 mb-3">{m.role}</p>
              <p className="text-sm text-neutral-600 leading-relaxed">{m.bio}</p>
              <button className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-900 font-semibold transition-all duration-200 px-3 py-1.5 bg-white border border-brand-100 rounded-lg hover:border-brand-300 hover:shadow-elevation-sm cursor-pointer">
                <Linkedin size={13} />
                LinkedIn
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactSection({ t }: { t: ContactT }) {
  const [form, setForm] = useState({ nom: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="section-gap bg-brand-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 gradient-orb bg-brand-600/20" style={{ animationDelay: '-2s' }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 gradient-orb bg-amber-600/10" />
      <div className="content-container relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">{t.title}</h2>
          <p className="text-brand-300 mb-12 text-lg">{t.sub}</p>

          {submitted ? (
            <div className="bg-brand-700/80 backdrop-blur-sm border border-brand-600 rounded-2xl p-10 text-center animate-scale-in">
              <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-glow-brand">
                <Check size={28} className="text-white" />
              </div>
              <p className="text-white font-heading font-bold text-xl">{t.sent}</p>
              <p className="text-brand-400 text-sm mt-2">{t.sentSub}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-400 mb-2 uppercase tracking-wider">{t.labels.name}</label>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder={t.placeholders.name}
                    className="w-full bg-brand-700/60 backdrop-blur-sm border border-brand-600 text-white placeholder:text-brand-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:shadow-glow-brand/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-400 mb-2 uppercase tracking-wider">{t.labels.email}</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t.placeholders.email}
                    className="w-full bg-brand-700/60 backdrop-blur-sm border border-brand-600 text-white placeholder:text-brand-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:shadow-glow-brand/20 transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-400 mb-2 uppercase tracking-wider">{t.labels.message}</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t.placeholders.message}
                  className="w-full bg-brand-700/60 backdrop-blur-sm border border-brand-600 text-white placeholder:text-brand-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:shadow-glow-brand/20 transition-all duration-200 resize-none"
                />
              </div>
              <div className="flex justify-center pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-600 text-white font-semibold text-sm rounded-xl hover:bg-amber-500 hover:shadow-glow-amber hover:-translate-y-0.5 active:translate-y-0 transition-all duration-250 shadow-elevation-sm cursor-pointer"
                >
                  <Send size={15} />
                  {t.btn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter({ text }: { text: string }) {
  return (
    <footer className="bg-brand-900 py-12">
      <div className="content-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-700 rounded-lg flex items-center justify-center">
              <Stethoscope size={13} className="text-brand-300" />
            </div>
            <span className="font-heading font-bold text-white text-sm">Neng‑Nom</span>
          </div>
          <p className="text-brand-600 text-xs text-center max-w-sm">{text}</p>
          <div className="flex items-center gap-5 text-xs text-brand-600">
            <a href="#" className="hover:text-brand-300 transition-colors duration-200">Conditions</a>
            <a href="#" className="hover:text-brand-300 transition-colors duration-200">Confidentialité</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-brand-800 text-center">
          <p className="text-brand-700 text-xs">© 2026 Neng‑Nom SAS · Douala, Cameroun</p>
        </div>
      </div>
    </footer>
  );
}
