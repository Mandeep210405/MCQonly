"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { getAdminStats } from "@/services/dashboard/AdminStats";
import { useSession } from "next-auth/react";
import UserModal from "./UserModal";

export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    getAdminStats()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const totalInterns = data?.interns_aggregate?.aggregate?.count ?? 0;
  const activeInterns = data?.active?.aggregate?.count ?? 0;
  const totalTasks = data?.tasks_aggregate?.aggregate?.count ?? 0;
  const depts = data?.departments_aggregate?.aggregate?.count ?? 0;

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center text-(--text-muted)">
        <h1>You are not authorized to view this page</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-5">
            Welcome, {session?.user?.name || "HR Professional"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold bg-[#e8eeff] text-[#1a3aff] px-4 py-1.5 rounded-full border border-[#1a3aff] uppercase">
              {session?.user?.role || "HR"}
            </span>
          </div>
        </div>
        
        {/* HR Control Buttons (Dummy as requested) */}
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setIsAddingUser(true)}
            className="bg-[#1a3aff] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 transition-all duration-200 whitespace-nowrap"
          >
            Add User / Intern
          </button>
          <button className="bg-white text-[#1a3aff] border border-[#1a3aff] px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:bg-gray-50 transition-all duration-200 whitespace-nowrap">
            Edit Intern Details
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[14px] py-[16px] px-[20px] mb-2 text-red-600 text-[14px] font-medium flex items-center gap-2">
          <span>⚠</span> 
          <span>Could not connect to data source. {error.message || error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Interns"
          value={totalInterns}
          sub={`${activeInterns} currently active`}
          loading={loading}
        />
        <StatCard
          label="Active Interns"
          value={activeInterns}
          accent="var(--status-active)"
          loading={loading}
        />
         <StatCard
          label="Total Departments"
          value={depts}
          loading={loading}
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          loading={loading}
        />
      </div>
      <div>
        {/* Recent Interns List with Edit Actions */}
        <div className="card p-6 border border-gray-100/50 shadow-sm rounded-2xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-[16px] font-semibold text-gray-900">
              Manage Interns (HR View)
            </h2>
            <Link
              href="/interns"
              className="text-[13px] text-[#1a3aff] font-medium no-underline hover:underline hover:opacity-80 transition-all flex items-center gap-1"
            >
              View all <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-[52px] rounded-xl" />
              ))
            ) : data?.recent_interns?.length === 0 ? (
               <div className="py-8 flex text-center flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <span className="text-2xl mb-2 opacity-50">👥</span>
                <p className="text-[14px] text-gray-500 font-medium">
                  No interns found.
                </p>
              </div>
            ) : (
              data?.recent_interns?.map((intern) => (
                <div
                  key={intern.id}
                  className="no-underline flex justify-between items-center gap-[14px] p-2.5 rounded-[12px] hover:bg-gray-50/80 transition-all group border border-transparent hover:border-gray-100"
                >
                  <Link href={`/interns/${intern.id}`} className="flex items-center gap-[14px] flex-1">
                    <div className="w-[38px] h-[38px] rounded-full bg-linear-to-br from-[#1a3aff] to-[#4a6aff] flex items-center justify-center text-[14px] font-bold text-white shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm shadow-[#1a3aff]/20">
                      {intern.userByUserId?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[14px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                        {intern.userByUserId?.name || "Unnamed"}
                      </p>
                      <p className="text-[12px] text-gray-500 truncate leading-tight mt-0.5">
                        {intern.department?.name ?? "No dept"} <span className="mx-1">•</span> {intern.position_title ?? "—"}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                     <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide border uppercase
                         ${intern.status === 'active' ? 'bg-green-50 text-green-700 border-green-200/50' : 'bg-gray-50 text-gray-700 border-gray-200/50'}
                     `}>
                       {intern.status}
                     </span>
                     <button className="text-[12px] px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#1a3aff] hover:border-[#1a3aff] transition-colors whitespace-nowrap">
                        ✎ Edit
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {isAddingUser && (
        <UserModal 
          mode="add" 
          onClose={() => setIsAddingUser(false)} 
          onSuccess={() => {
            setIsAddingUser(false);
          }} 
        />
      )}
    </div>
  );
}
