"use client";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  Star,
  Building,
  Megaphone,
  MessageSquare,
  BookOpen,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const canManage = ["admin", "hr", "mentor"].includes(session?.user?.role);

  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const linkBase =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all";

  const activeClass =
    "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] font-medium";

  const inactiveClass =
    "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]";

  const iconClass = "w-4 h-4";

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-(--bg-surface) border-r border-(--border) flex flex-col px-4 py-7 z-50">
      {/* Logo */}
      <div className="px-2 pb-8">
        <div className="flex items-center gap-2 font-bold text-lg text-(--text-primary)">
          <div className="w-8 h-8 bg-(--accent) rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
            I
          </div>
          InternOS
        </div>
        <p className="text-xs text-(--text-muted) mt-1 pl-10">
          Management System
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <Link
          href="/dashboard"
          aria-current={isActive("/dashboard") ? "page" : undefined}
          className={`${linkBase} ${isActive("/dashboard") ? activeClass : inactiveClass}`}
        >
          <LayoutDashboard className={iconClass} />
          Overview
        </Link>

        {canManage ? (
          <Link
            href="/interns"
            aria-current={isActive("/interns") ? "page" : undefined}
            className={`${linkBase} ${isActive("/interns") ? activeClass : inactiveClass}`}
          >
            <Users className={iconClass} />
            Interns
          </Link>
        ) : (
          <Link
            href="/my-profile"
            aria-current={isActive("/my-profile") ? "page" : undefined}
            className={`${linkBase} ${isActive("/my-profile") ? activeClass : inactiveClass}`}
          >
            <Users className={iconClass} />
            My Profile
          </Link>
        )}

        <Link
          href="/tasks"
          aria-current={isActive("/tasks") ? "page" : undefined}
          className={`${linkBase} ${isActive("/tasks") ? activeClass : inactiveClass}`}
        >
          <CheckSquare className={iconClass} />
          Tasks
        </Link>

        <Link
          href="/attendance"
          aria-current={isActive("/attendance") ? "page" : undefined}
          className={`${linkBase} ${isActive("/attendance") ? activeClass : inactiveClass}`}
        >
          <Calendar className={iconClass} />
          Attendance
        </Link>

        <Link
          href="/evaluations"
          aria-current={isActive("/evaluations") ? "page" : undefined}
          className={`${linkBase} ${isActive("/evaluations") ? activeClass : inactiveClass}`}
        >
          <Star className={iconClass} />
          Evaluations
        </Link>

        <Link
          href="/tests"
          aria-current={isActive("/tests") ? "page" : undefined}
          className={`${linkBase} ${isActive("/tests") ? activeClass : inactiveClass}`}
        >
          <BookOpen className={iconClass} />
          AI Tests
        </Link>

        {canManage && (
          <Link
            href="/departments"
            aria-current={isActive("/departments") ? "page" : undefined}
            className={`${linkBase} ${isActive("/departments") ? activeClass : inactiveClass}`}
          >
            <Building className={iconClass} />
            Departments
          </Link>
        )}

        <Link
          href="/announcements"
          aria-current={isActive("/announcements") ? "page" : undefined}
          className={`${linkBase} ${isActive("/announcements") ? activeClass : inactiveClass}`}
        >
          <Megaphone className={iconClass} />
          Announcements
        </Link>

        {canManage && (
          <Link
            href="/chatbot"
            aria-current={isActive("/chatbot") ? "page" : undefined}
            className={`${linkBase} ${isActive("/chatbot") ? activeClass : inactiveClass}`}
          >
            <MessageSquare className={iconClass} />
            AI Chatbot
          </Link>
        )}

        {canManage && (
          <Link
            href="/users"
            aria-current={isActive("/users") ? "page" : undefined}
            className={`${linkBase} ${isActive("/users") ? activeClass : inactiveClass}`}
          >
            <Users className={iconClass} />
            Users
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-(--border) pt-4 px-2 flex flex-col items-center gap-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-center py-2 rounded-lg text-sm transition hover:border hover:border-red-400 hover:text-red-400"
        >
          Logout
        </button>

        <div className="flex items-center gap-2 w-full">
          <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-sm font-semibold">
            {session?.user?.name?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-(--text-primary) truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-(--text-muted) truncate">
              {session?.user?.email || "No email"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
