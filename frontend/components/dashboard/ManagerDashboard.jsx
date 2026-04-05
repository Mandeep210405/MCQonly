// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import StatCard from "@/components/dashboard/StatCard";
// import { useSession } from "next-auth/react";
// import { getManagerDepartment } from "@/services/dashboard/DepartmentApi";

// export default function ManagerDashboard() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { data: session, status } = useSession();

//   useEffect(() => {
//     if (status === "authenticated" && session?.user?.id) {
//       getManagerDepartment(session.user.id)
//         .then((result) => {
//           if (result.success && result.data?.departments?.length > 0) {
//             setData(result.data.departments[0]);
//           } else if (result.success && result.data?.departments?.length === 0) {
//             setError("No department found linked to this manager profile. Please contact an Administrator.");
//           } else {
//             setError(result.error || "Failed to fetch data");
//           }
//         })
//         .catch((err) => setError(err.message))
//         .finally(() => setLoading(false));
//     } else if (status === "unauthenticated") {
//       setLoading(false);
//     }
//   }, [status, session]);

//   if (status === "unauthenticated") {
//     return (
//       <div className="p-8 text-center text-(--text-muted)">
//         <h1>You are not authorized to view this page</h1>
//       </div>
//     );
//   }

//   // Calculate statistics safely derived from GraphQL response
//   const internsList = data?.interns || [];
//   const totalInterns = internsList.length;
//   const activeInterns = totalInterns; 
//   const totalTasks = 0; 
//   const pendingTasks = 0; 

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header Section */}
//       <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-5">
//             Welcome, {session?.user?.name || 'Manager'}
//           </h1>
//           <div className="flex flex-wrap items-center gap-3">
//             <span className="text-sm font-semibold bg-[#e8eeff] text-[#1a3aff] px-4 py-1.5 rounded-full border border-[#1a3aff]">
//               {session?.user?.role || "Manager"}
//             </span>
//             {data?.name && (
//               <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full border border-gray-200">
//                 {data.name} Department
//               </span>
//             )}
//           </div>
//         </div>
        
//         {/* Dummy Manager Control Buttons */}
//         <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
//           <button className="bg-[#1a3aff] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 whitespace-nowrap">
//             Add Intern
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[14px] py-[16px] px-[20px] mb-2 text-red-600 text-[14px] font-medium flex items-center gap-2">
//           <span>⚠</span> 
//           <span>{error}</span>
//         </div>
//       )}

//       {/* Stat Cards - Mirroring AdminDashboard styles */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-4">
//         <StatCard
//           label="Total Interns"
//           value={totalInterns}
//           sub={`${activeInterns} currently active`}
//           loading={loading}
//         />
//         <StatCard
//           label="Active Interns"
//           value={activeInterns}
//           accent="var(--status-active)"
//           loading={loading}
//         />
//         <StatCard
//           label="Assigned Tasks"
//           value={totalTasks}
//           sub={`${pendingTasks} pending`}
//           loading={loading}
//         />
//       </div>

//       {/* Main Grid: Interns List and Task List UI */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
//         {/* Department Interns List */}
//         <div className="card p-6 border border-gray-100/50 shadow-sm rounded-2xl bg-white">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="font-display text-[16px] font-semibold text-(--text-primary)">
//               Department Interns
//             </h2>
//             <Link
//               href="/interns"
//               className="text-[13px] text-[#1a3aff] font-medium no-underline hover:underline hover:opacity-80 transition-all flex items-center gap-1"
//             >
//               View all <span className="text-lg leading-none">→</span>
//             </Link>
//           </div>

//           <div className="flex flex-col gap-2">
//             {loading ? (
//               [1, 2, 3].map((i) => (
//                 <div key={i} className="skeleton h-[52px] rounded-xl" />
//               ))
//             ) : internsList.length === 0 ? (
//               <div className="py-8 flex text-center flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
//                 <span className="text-2xl mb-2 opacity-50">👥</span>
//                 <p className="text-[14px] text-(--text-muted) font-medium">
//                   No interns managed yet.
//                 </p>
//                 <p className="text-[12px] text-gray-400 mt-1 max-w-[200px]">
//                   Add interns to this department to populate the list.
//                 </p>
//               </div>
//             ) : (
//               internsList.slice(0, 5).map((intern, i) => (
//                 <Link
//                   key={intern.user?.id || i}
//                   href={`/interns/${intern.user?.id || 'unknown'}`}
//                   className="no-underline flex items-center gap-[14px] p-2.5 rounded-[12px] hover:bg-gray-50/80 transition-all group border border-transparent hover:border-gray-100"
//                 >
//                   <div className="w-[38px] h-[38px] rounded-full bg-linear-to-br from-[#1a3aff] to-[#4a6aff] flex items-center justify-center text-[14px] font-bold text-white shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm shadow-[#1a3aff]/20">
//                     {intern.user?.name?.[0]?.toUpperCase() ?? "?"}
//                   </div>

//                   <div className="flex-1 min-w-0 flex flex-col justify-center">
//                     <p className="text-[14px] font-semibold text-(--text-primary) whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
//                       {intern.user?.name || "Unnamed"}
//                     </p>
//                     <p className="text-[12px] text-(--text-muted) truncate leading-tight mt-0.5">
//                       {intern.user?.email || "No email"} <span className="mx-1">•</span> {intern.college || "No college specified"}
//                     </p>
//                   </div>

//                   <span className="shrink-0 bg-green-50 text-green-700 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide border border-green-200/50 uppercase">
//                     Active
//                   </span>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Dummy Task Board Overview */}
//         <div className="card p-6 border border-gray-100/50 shadow-sm rounded-2xl bg-white">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="font-display text-[16px] font-semibold text-(--text-primary)">
//               Recent Tasks
//             </h2>
//             <Link
//               href="/tasks"
//               className="text-[13px] text-[#1a3aff] font-medium no-underline hover:underline hover:opacity-80 transition-all flex items-center gap-1"
//             >
//               View all <span className="text-lg leading-none">→</span>
//             </Link>
//           </div>

//           <div className="flex flex-col gap-3">
//             {loading ? (
//               [1, 2, 3].map((i) => (
//                 <div key={i} className="skeleton h-[52px] rounded-xl" />
//               ))
//             ) : (
//               <div className="py-8 flex text-center flex-col items-center justify-center rounded-xl">
//                 <p className="text-[14px] text-(--text-muted) font-medium">
//                   Task Not Found, Create First
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { useSession } from "next-auth/react";
import { getManagerDepartment } from "@/services/dashboard/DepartmentApi";

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      getManagerDepartment(session.user.id)
        .then((result) => {
          if (result.success && result.data?.departments?.length > 0) {
            setData(result.data.departments[0]);
          } else if (result.success && result.data?.departments?.length === 0) {
            setError("No department found linked to this manager profile. Please contact an Administrator.");
          } else {
            setError(result.error || "Failed to fetch data");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "unauthenticated") {
    return (
      <div className="p-8 text-center text-(--text-muted)">
        <h1>You are not authorized to view this page</h1>
      </div>
    );
  }

  // Calculate statistics safely derived from GraphQL response
  const internsList = data?.interns || [];
  const totalInterns = internsList.length;
  const activeInterns = totalInterns; 
  const totalTasks = 0; 
  const pendingTasks = 0; 

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-5">
            Welcome, {session?.user?.name || 'Manager'}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold bg-[#e8eeff] text-[#1a3aff] px-4 py-1.5 rounded-full border border-[#1a3aff]">
              {session?.user?.role || "Manager"}
            </span>
            {data?.name && (
              <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full border border-gray-200">
                {data.name} Department
              </span>
            )}
          </div>
        </div>
        
        {/* Dummy Manager Control Buttons */}
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <button className="bg-[#1a3aff] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 whitespace-nowrap">
            Add Intern
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[14px] py-[16px] px-[20px] mb-2 text-red-600 text-[14px] font-medium flex items-center gap-2">
          <span>⚠</span> 
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards - Mirroring AdminDashboard styles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-4">
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
          label="Assigned Tasks"
          value={totalTasks}
          sub={`${pendingTasks} pending`}
          loading={loading}
        />
      </div>

      {/* Main Grid: Interns List and Task List UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Department Interns List */}
        <div className="card p-6 border border-gray-100/50 shadow-sm rounded-2xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-[16px] font-semibold text-(--text-primary)">
              Department Interns
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
                <div key={i} className="skeleton h-[52px] rounded-xl" />
              ))
            ) : internsList.length === 0 ? (
              <div className="py-8 flex text-center flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <span className="text-2xl mb-2 opacity-50">👥</span>
                <p className="text-[14px] text-(--text-muted) font-medium">
                  No interns managed yet.
                </p>
                <p className="text-[12px] text-gray-400 mt-1 max-w-[200px]">
                  Add interns to this department to populate the list.
                </p>
              </div>
            ) : (
              internsList.slice(0, 5).map((intern, i) => (
                <Link
                  key={intern.id || intern.user?.id || i}
                  href={`/interns/${intern.user?.id || 'unknown'}`}
                  className="no-underline flex items-center gap-[14px] p-2.5 rounded-[12px] hover:bg-gray-50/80 transition-all group border border-transparent hover:border-gray-100"
                >
                  <div className="w-[38px] h-[38px] rounded-full bg-linear-to-br from-[#1a3aff] to-[#4a6aff] flex items-center justify-center text-[14px] font-bold text-white shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm shadow-[#1a3aff]/20">
                    {intern.user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[14px] font-semibold text-(--text-primary) whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                      {intern.user?.name || "Unnamed"}
                    </p>
                    <p className="text-[12px] text-(--text-muted) truncate leading-tight mt-0.5">
                      {intern.user?.email || "No email"} <span className="mx-1">•</span> {intern.college || "No college specified"}
                    </p>
                  </div>

                  <span className="shrink-0 bg-green-50 text-green-700 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide border border-green-200/50 uppercase">
                    Active
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Dummy Task Board Overview */}
        <div className="card p-6 border border-gray-100/50 shadow-sm rounded-2xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-[16px] font-semibold text-(--text-primary)">
              Recent Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-[13px] text-[#1a3aff] font-medium no-underline hover:underline hover:opacity-80 transition-all flex items-center gap-1"
            >
              View all <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-[52px] rounded-xl" />
              ))
            ) : (
              <div className="py-8 flex text-center flex-col items-center justify-center rounded-xl">
                <p className="text-[14px] text-(--text-muted) font-medium">
                  Task Not Found, Create First
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}