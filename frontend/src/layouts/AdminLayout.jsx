import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, Globe } from 'lucide-react';
import LogoutButton from '../components/common/LogoutButton';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#33251d]">
      <header className="sticky top-0 z-40 border-b border-[#6b4936] bg-[#4b3023] text-white shadow-md">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block text-sm font-extrabold tracking-wide">LearnAfrica</span><span className="block text-[11px] text-[#e5d4c7]">Administration workspace</span></span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"><Globe className="h-4 w-4" /><span className="hidden sm:inline">View website</span></Link>
            <div className="[&_button]:text-white [&_button]:border-white/20"><ThemeToggle compact /></div>
            <LogoutButton variant="icon" label="Logout" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-2 py-4 sm:px-5 sm:py-6"><Outlet /></main>
    </div>
  );
}
