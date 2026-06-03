import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, MessageSquareHeart, Shield, Zap, Globe, FileImage, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const starPositions = [
  { top: '10%', left: '20%', size: 2, delay: 0, duration: 4 },
  { top: '25%', left: '80%', size: 3, delay: 1, duration: 3 },
  { top: '50%', left: '10%', size: 1.5, delay: 2, duration: 5 },
  { top: '75%', left: '70%', size: 2, delay: 0.5, duration: 4 },
  { top: '15%', left: '50%', size: 2.5, delay: 1.5, duration: 3 },
  { top: '85%', left: '30%', size: 2, delay: 2.5, duration: 6 },
  { top: '40%', left: '90%', size: 1, delay: 0.2, duration: 4 },
  { top: '60%', left: '40%', size: 3, delay: 1.2, duration: 3.5 },
  { top: '30%', left: '15%', size: 2, delay: 0.8, duration: 4.5 },
  { top: '90%', left: '85%', size: 1.5, delay: 2.1, duration: 5 },
  { top: '5%', left: '90%', size: 2, delay: 3, duration: 4 },
  { top: '45%', left: '60%', size: 2.5, delay: 1.7, duration: 3 },
  { top: '70%', left: '20%', size: 1.5, delay: 0.4, duration: 5 },
  { top: '95%', left: '50%', size: 2, delay: 2.8, duration: 4 },
  { top: '20%', left: '40%', size: 1, delay: 1.9, duration: 4.5 },
];

const features = [
  {
    title: "Instant Real-time Messaging",
    description: "Experience zero-latency communication with our highly optimized WebSocket infrastructure.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Secure & Private",
    description: "End-to-end security for all your direct messages and groups.",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Media Sharing",
    description: "Drag and drop images, videos, and files effortlessly.",
    icon: FileImage,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Connect Anywhere",
    description: "Available on desktop and mobile with a responsive, adaptive UI.",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    className: "md:col-span-2 md:row-span-1",
  }
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div 
      className="relative min-h-screen overflow-hidden bg-[var(--clay-bg-app)] selection:bg-[var(--clay-primary)]/20 text-slate-900"
      style={{
        '--clay-bg-app': '#e8ebf2',
        '--clay-bg-panel': '#f0f3fa',
        '--clay-primary': '#6c8ae4',
        '--clay-text-primary': '#0f172a',
        '--clay-text-secondary': '#475569',
      } as React.CSSProperties}
    >
      {/* Shining Stars Layer (Zero Heat CSS Animation) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        {starPositions.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Premium CSS Mesh Gradient Background (Zero Blur/Zero Heat) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, var(--clay-primary) 0%, transparent 40%),
            radial-gradient(circle at 100% 0%, #10b981 0%, transparent 40%),
            radial-gradient(circle at 50% 100%, #3b82f6 0%, transparent 40%)
          `
        }}
      ></div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-32 pb-20 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:100ms] mb-8 inline-flex items-center gap-2 rounded-full bg-[var(--clay-bg-panel)] px-6 py-2.5 shadow-clay-sm transition-transform hover:-translate-y-1">
          <Zap className="h-5 w-5 text-[var(--clay-primary)]" />
          <strong className="text-lg font-extrabold tracking-widest text-[var(--clay-primary)] uppercase">Nextra</strong>
        </div>

        {/* Hero Title */}
        <h1 className="animate-fade-in-up opacity-0 [animation-delay:200ms] max-w-4xl text-[var(--clay-text-primary)] text-5xl font-extrabold tracking-tight sm:text-7xl drop-shadow-sm">
          Connect and collaborate without limits.
        </h1>

        {/* Hero Subtitle */}
        <p className="animate-fade-in-up opacity-0 [animation-delay:300ms] mt-6 max-w-2xl text-lg text-[var(--clay-text-secondary)] sm:text-xl">
          A beautifully designed, lightning-fast platform for teams and communities to stay in touch through instant messaging and seamless file sharing.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:400ms] mt-10 flex flex-wrap justify-center gap-4">
          {userId ? (
            <Button asChild size="lg" className="rounded-full px-8 bg-[var(--clay-primary)] text-white hover:bg-[var(--clay-primary)]/90 shadow-clay-sm transition-transform hover:-translate-y-1">
              <Link href="/chat">
                Open App <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-full px-8 bg-[var(--clay-primary)] text-white hover:bg-[var(--clay-primary)]/90 shadow-clay-sm transition-transform hover:-translate-y-1">
                <Link href="/sign-up">
                  Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-[var(--clay-bg-panel)] text-[var(--clay-text-primary)] border-none shadow-clay-sm transition-transform hover:-translate-y-1 hover:bg-[var(--clay-bg-panel)]/90">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </>
          )}
        </div>

        {/* Bento Grid */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:600ms] mt-24 grid w-full max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-2 text-left">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`group relative overflow-hidden rounded-[2.5rem] bg-[var(--clay-bg-panel)] shadow-clay-md p-8 transition-all hover:shadow-clay-lg hover:-translate-y-2 ${feature.className}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-clay-inset bg-[var(--clay-bg-app)]`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--clay-text-primary)] tracking-tight">{feature.title}</h3>
              <p className="text-[var(--clay-text-secondary)] font-medium leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Footer info */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:800ms] mt-20 flex flex-col items-center justify-center gap-4 text-[var(--clay-text-secondary)] text-sm font-semibold sm:flex-row sm:gap-6">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--clay-bg-panel)] shadow-clay-sm">
            <Users className="h-4 w-4" /> Built for Teams
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--clay-bg-panel)] shadow-clay-sm">
            <MessageCircle className="h-4 w-4" /> Real-time Sync
          </div>
        </div>
      </div>
    </div>
  );
}
