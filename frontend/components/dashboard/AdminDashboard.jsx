"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { getAdminStats } from "@/services/dashboard/AdminStats";
import { useSession } from "next-auth/react";
import DepartmentList from "./DepartmentList";
import UserModal from "./UserModal";

export default function AdminDashboard() {
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
  const pendingTasks = data?.pending_tasks?.aggregate?.count ?? 0;
  const depts = data?.departments_aggregate?.aggregate?.count ?? 0;

  if (status === "unauthenticated") {
    return (
      <div>
        <h1>You are not authorized to view this page</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
            <div className='bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 mb-5'>Welcome, {session?.user?.name}</h1>
                    <div className='flex flex-wrap items-center gap-3'>
                        <span className='text-sm font-semibold bg-[#e8eeff] text-[#1a3aff] px-4 py-1.5 rounded-full border border-[#1a3aff]'>
                            {session?.user?.role || 'Intern'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-4">
                  <div 
                    onClick={() => setIsAddingUser(true)}
                    className="bg-[#1a3aff] text-white px-4 py-2 rounded-lg cursor-pointer hover:shadow-md hover:shadow-[#1a3aff]/50 hover:bg-[#1a3aff]/80 transition-all duration-200"
                  >
                    Add User
                  </div>
                </div>
            </div>


      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[10px] py-[14px] px-[18px] mb-6 text-[#fca5a5] text-[13px]">
          ⚠ Could not connect to Hasura. Check your .env.local and make sure
          Docker is running.
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
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
          label="Total Tasks"
          value={totalTasks}
          sub={`${pendingTasks} pending`}
          loading={loading}
        />
        <StatCard label="Departments" value={depts} loading={loading} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-[15px] font-semibold">
              Recent Interns
            </h2>
            <Link
              href="/interns"
              className="text-[12px] text-[var(--accent-light)] no-underline"
            >
              View all →
            </Link>
          </div>

          <div className="flex flex-col gap-[14px]">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-[42px]" />
              ))
            ) : data?.recent_interns?.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">
                No interns yet.
              </p>
            ) : (
              data?.recent_interns?.map((intern) => (
                <Link
                  key={intern.id}
                  href={`/interns/${intern.id}`}
                  className="no-underline flex items-center gap-3"
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-[var(--accent)] flex items-center justify-center text-[13px] font-semibold text-white shrink-0">
                    {intern.userByUserId?.name?.[0] ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
                      {intern.userByUserId?.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {intern.department?.name ?? "No dept"} ·{" "}
                      {intern.position_title ?? "—"}
                    </p>
                  </div>

                  <span className={`badge badge-${intern.status}`}>
                    {intern.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-[15px] font-semibold">
              Recent Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-[12px] text-[var(--accent-light)] no-underline"
            >
              View all →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-[42px]" />
              ))
            ) : data?.recent_tasks?.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">
                No tasks yet.
              </p>
            ) : (
              data?.recent_tasks?.map((task) => (
                <div key={task.id} className="flex items-center gap-[10px]">
                  <span
                    className={`w-[7px] h-[7px] rounded-full shrink-0 inline-block ${
                      task.priority === "high"
                        ? "bg-[#ef4444]"
                        : task.priority === "medium"
                          ? "bg-[#f59e0b]"
                          : "bg-[#22c55e]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {task.intern?.userByUserId?.name ?? "—"}
                    </p>
                  </div>

                  <span className={`badge badge-${task.status}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* manage departments */}
      <DepartmentList />

      {isAddingUser && (
        <UserModal 
          mode="add" 
          onClose={() => setIsAddingUser(false)} 
          onSuccess={() => {
            setIsAddingUser(false);
            // Optional: refresh admin stats if needed, or simply let the user show up in users tab
          }} 
        />
      )}
    </div>
  );
}
