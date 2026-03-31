'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutDashboard, ShieldCheck, Users, Zap, CheckCircle2, BarChart, UserCheck, Building, CheckSquare, Clock, Bot } from 'lucide-react'
import Image from 'next/image'

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#0a0f2e]">Intern<span className='text-[#1a3aff]'>OS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-semibold text-gray-500 hover:text-[#1a3aff] transition-colors">Features</Link>
            <Link href="#about" className="text-sm font-semibold text-gray-500 hover:text-[#1a3aff] transition-colors">About</Link>
            <Link href="/auth/login" className="px-6 py-2.5 bg-[#1a3aff] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 transition-all duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[#0a0f2e] mb-8 leading-[1.1] animate-fadeUp">
            Elevate Your <br />
            <span className="text-[#1a3aff]">Intern Experience</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 mb-12 animate-fadeUp" style={{ animationDelay: '100ms' }}>
            Streamline onboarding, tasks tracking, and performance evaluations with the management platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeUp" style={{ animationDelay: '200ms' }}>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-[#1a3aff] text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#1a3aff]/30 hover:scale-[1.02] transition-all duration-200"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-600 border border-gray-200 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>

          {/* Hero Visual Placeholder */}
          <div className="mt-20 max-w-5xl mx-auto relative group animate-fadeUp" style={{ animationDelay: '300ms' }}>
            <div className="absolute -inset-1 bg-linear-to-r from-[#1a3aff] to-[#7c5cfc] rounded-4xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden  flex items-center justify-center p-4">
              <Image className='rounded-lg border border-gray-200' src="/landingDashboard.png" alt="Hero" width={1500} height={1500} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0a0f2e] mb-6">Built for Modern Teams</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to nurture and manage talent in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Role-Based Dashboards</h3>
              <p className="text-gray-500 leading-relaxed">
                Personalized dashboards for Admins, HRs, Managers, and Interns—ensuring each user sees only what matters most.
              </p>
            </div>

            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Smart Announcements</h3>
              <p className="text-gray-500 leading-relaxed">
                Broadcast important updates instantly across teams or departments with targeted announcement controls.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <Bot size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">AI Chat Assistant</h3>
              <p className="text-gray-500 leading-relaxed">
                Get instant help with tasks, queries, and guidance through an intelligent AI assistant built to support interns and teams.
              </p>
            </div>

            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <BarChart size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Performance Tracking</h3>
              <p className="text-gray-500 leading-relaxed">
                Monitor intern growth with structured evaluations, performance insights, and detailed progress reports.
              </p>
            </div>
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <UserCheck size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Intern Management</h3>
              <p className="text-gray-500 leading-relaxed">
                Easily onboard, assign roles, and track intern activities from start to completion in one place.
              </p>
            </div>
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <Building size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Department Management</h3>
              <p className="text-gray-500 leading-relaxed">
                Organize teams efficiently by creating and managing departments with clear hierarchies and responsibilities.
              </p>
            </div>
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <CheckSquare size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Task Management</h3>
              <p className="text-gray-500 leading-relaxed">
                Assign, monitor, and manage tasks seamlessly with deadlines, priorities, and real-time progress updates.
              </p>
            </div>
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
                <Clock size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">Attendance System</h3>
              <p className="text-gray-500 leading-relaxed">
                Track daily attendance, working hours, and reports with an automated and transparent system.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl font-bold text-[#0a0f2e]">Intern<span className='text-[#1a3aff]'>OS</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The next generation intern management platform for high-growth companies. Scale your talent without the overhead.
              </p>
            </div>

            <div>
              <div>
                <h4 className="text-[#0a0f2e] font-bold mb-6">Meet Our Team</h4>
                <ul className="space-y-4 flex flex-col items-center text-sm text-gray-500">
                  <li><div>Vidhika</div></li>
                  <li><div>Mandeep</div></li>
                  <li><div>Meet</div></li>
                  <li><div>Parth</div></li>
                  <li><div>Jay</div></li>
                </ul>
              </div>
            </div>
          </div>


        </div>
      </footer>
    </div>
  )
}