"use client"
import React from 'react'
import { useSession } from 'next-auth/react'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import InternDashboard from '@/components/dashboard/InternDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import HRDashboard from '@/components/dashboard/HRDashboard';

function Dashboard() {
  const { data: session, status } = useSession();
  return (
    <div>
      {status === "loading" ? (
        <div className="flex h-screen items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#1a3aff] border-t-transparent animate-spin"></div>
        </div>
      ) : status === "authenticated" && session?.user?.role === "admin" ? (
        <AdminDashboard />
      ) : status === "authenticated" && session?.user?.role === "intern" ? (
        <InternDashboard />
      ) : status === "authenticated" && (session?.user?.role === "manager" || session?.user?.role === "mentor") ? (
        <ManagerDashboard />
      ) : status === "authenticated" && session?.user?.role === "hr" ? (
        <HRDashboard />
      ) : (
        <div className="flex h-screen items-center justify-center flex-col">
          <h1 className="text-2xl font-bold text-gray-800">You are not authorized to view this page</h1>
          <p className="text-gray-500 mt-2">Please contact your administrator if you believe this is an error.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard;