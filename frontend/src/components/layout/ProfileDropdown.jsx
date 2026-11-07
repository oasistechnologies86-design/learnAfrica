import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Settings, ChevronDown, User, Shield, BookMarked, BarChart2, Receipt, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import MobileProfileDrawer from './MobileProfileDrawer';
import LogoutButton from '@/components/common/LogoutButton';

export default function ProfileDropdown({ hideChevron = false, closeMainMenu }) {
  const [isOpen, setIsOpen]       = useState(false);
  const [imgError, setImgError]   = useState(false);
  const dropdownRef               = useRef(null);
  const { user, isLoading }       = useAuth();

  const isAdmin      = ['admin','superadmin'].includes(user?.role);
  // Approved instructor only — pending/rejected get just the Dashboard pending screen
  const isInstructor = isAdmin || (user?.role === 'instructor' && user?.instructor_status === 'approved');

  const close = useCallback(() => {
    setIsOpen(false);
    if (closeMainMenu) closeMainMenu();
  }, [closeMainMenu]);

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current) return;
      // Don't close if click is inside the dropdown trigger
      if (dropdownRef.current.contains(e.target)) return;
      // Don't close if click is inside the portaled mobile drawer
      if (e.target.closest && e.target.closest('[data-profile-drawer]')) return;
      // Don't close if click is inside the portaled logout confirm dialog
      if (e.target.closest && e.target.closest('[data-logout-confirm]')) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const homeLink    = isInstructor ? '/instructor' : '/dashboard';
  const settingsLink = '/settings';

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        aria-label="Open profile menu" aria-expanded={isOpen}
        className={cn(
          'group flex w-full px-3 md:px-2 md:w-10 md:h-10 h-14 cursor-pointer items-center md:justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all active:scale-[0.98]',
          isOpen && 'bg-primary/15 border-primary/50'
        )}>
        <span className="ml-1 md:ml-0 flex shrink-0 items-center justify-center">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-primary/10 ring-1 ring-primary/30">
            {!imgError && user?.avatar
              ? <img src={user.avatar} onError={() => setImgError(true)} className="h-full w-full object-cover" alt="" />
              : <User className="h-5 w-5 text-primary" />}
          </span>
        </span>
        <span className="ml-3 md:hidden text-sm font-bold">Profile</span>
        {!hideChevron && <ChevronDown className={cn('ml-auto md:ml-0 h-4 w-4 transition-transform', isOpen && 'rotate-180')} />}
      </button>

      {/* Desktop dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-border bg-background shadow-2xl z-[200] hidden md:flex flex-col overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* User info */}
          <Link to="/profile" onClick={close}
            className="flex items-center gap-3 p-4 bg-primary/10 hover:bg-primary/15 border-b border-primary/20 transition-colors">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/10 border border-primary/30 ring-1 ring-primary/15 shrink-0">
              {!imgError && user?.avatar
                ? <img src={user.avatar} className="h-full w-full object-cover" alt="" />
                : <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary"><User className="h-5 w-5" /></div>}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-[10px] font-semibold text-primary mt-0.5">View and edit profile</p>
              <span className={cn('text-3xs font-bold uppercase',
                isAdmin ? 'text-destructive' : isInstructor ? 'text-primary' : 'text-muted-foreground')}>
                {user?.role}
              </span>
            </div>
          </Link>

          {/* Links */}
          <div className="p-2 space-y-0.5">
            <DropLink to={homeLink} icon={<LayoutDashboard className="h-4 w-4" />}
              label={isInstructor ? 'Instructor Dashboard' : 'My Dashboard'} onClick={close} />
            {isInstructor && (
              <DropLink to="/instructor/courses" icon={<BookMarked className="h-4 w-4" />} label="My Courses" onClick={close} />
            )}
            {isAdmin && (
              <DropLink to="/admin" icon={<Shield className="h-4 w-4" />} label="Admin Panel" onClick={close} variant="accent" />
            )}
            {user?.role === 'student' && <DropLink to="/my-certificates" icon={<Award className="h-4 w-4" />} label="My Certificates" onClick={close} />}
            <DropLink to={settingsLink} icon={<Settings className="h-4 w-4" />} label="Settings" onClick={close} />
            <DropLink to="/receipts" icon={<Receipt className="h-4 w-4" />} label="Receipts" onClick={close} />
          </div>

          <div className="p-2 border-t border-border">
            <LogoutButton variant="menu" onLoggedOut={close} />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <MobileProfileDrawer isOpen={isOpen} onClose={close} user={user} isLoading={isLoading}
        isInstructor={isInstructor} isAdmin={isAdmin}
        imgError={imgError}
        isDesktopPopover={false} />
    </div>
  );
}

function DropLink({ to, icon, label, onClick, variant = 'default' }) {
  return (
    <Link to={to} onClick={onClick}
      className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        variant === 'accent' ? 'text-primary hover:bg-primary/10' : 'text-foreground/80 hover:bg-muted')}>
      <span className="text-muted-foreground">{icon}</span>{label}
    </Link>
  );
}
