"use client";

import { getAllDepartments } from "@/services/dashboard/DepartmentApi";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllDepartments()
      .then((data) => {
        if (data?.error) throw new Error(data.error);
        setDepartments(data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[10px] py-[14px] px-[18px] text-[#fca5a5] text-[13px]">
        ⚠ Failed to load departments: {error}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-[16px] font-semibold text-(--text-primary)">
          Departments Overview
        </h2>
        <Link
          href="/departments"
          className="text-[13px] text-[#1a3aff] font-medium hover:text-[#1a3aff]/80 transition-colors no-underline flex items-center gap-1"
        >
          View all <span className="text-[16px] leading-none">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[140px] rounded-[14px]" />
          ))
        ) : departments.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center border-2 border-dashed border-[rgba(0,0,0,0.05)] rounded-[14px] bg-[rgba(0,0,0,0.01)]">
            <div className="w-12 h-12 bg-[rgba(0,0,0,0.04)] rounded-full flex items-center justify-center mb-3">
              <span className="text-[20px] opacity-50">🏢</span>
            </div>
            <p className="text-[14px] text-(--text-muted) font-medium">
              No departments found
            </p>
            <p className="text-[12px] text-(--text-muted) mt-1 opacity-70">
              Create a department to get started
            </p>
          </div>
        ) : (
          departments.map((department) => (
            <Link
              href={`/departments/${department.id}`}
              key={department.id}
              className="group p-5 rounded-[14px] border border-[rgba(0,0,0,0.06)] hover:border-[#1a3aff]/30 hover:shadow-[0_8px_24px_-8px_rgba(26,58,255,0.15)] transition-all duration-300 bg-white relative overflow-hidden flex flex-col justify-between min-h-[140px] no-underline"
            >
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-[14px] items-center">
                  <div className="w-[44px] h-[44px] rounded-xl bg-[#e8eeff] text-[#1a3aff] flex items-center justify-center font-bold text-[18px] group-hover:scale-105 transition-transform duration-300 shrink-0">
                    {department.name?.charAt(0) || "D"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] text-(--text-primary) group-hover:text-[#1a3aff] transition-colors duration-300 truncate">
                      {department.name}
                    </h3>
                    <p className="text-[12px] text-(--text-muted) line-clamp-1 mt-0.5">
                      {department.description || "No description provided"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[rgba(0,0,0,0.04)] flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="w-[28px] h-[28px] rounded-full bg-[rgba(0,0,0,0.05)] border border-[rgba(0,0,0,0.05)] flex items-center justify-center text-[12px] text-(--text-primary) font-semibold shrink-0">
                    {department.departmentHead?.name?.charAt(0) || "?"}
                  </div>
                  <div className="text-[12px] flex flex-col leading-tight min-w-0">
                    <span className="text-(--text-muted) text-[9px] uppercase font-bold tracking-[0.05em] mb-0.5">
                      Head of Dept
                    </span>
                    <span className="font-semibold text-(--text-primary) truncate text-ellipsis max-w-[120px]">
                      {department.user?.name || "Unassigned"}
                    </span>
                  </div>
                </div>
                <div className="text-(--text-muted) group-hover:text-[#1a3aff] transition-all group-hover:translate-x-1 duration-300 bg-[rgba(0,0,0,0.02)] group-hover:bg-[#e8eeff] w-8 h-8 rounded-full flex items-center justify-center text-[14px] shrink-0">
                  →
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
