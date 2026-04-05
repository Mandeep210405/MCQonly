// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
// import Link from 'next/link';
// import TestModal from '@/components/TestModal';
// import TestTaker from '@/components/TestTaker';
// import TestResults from '@/components/TestResults';

// const STATUS_COLORS = {
//   scheduled: '#f59e0b',
//   in_progress: '#3b82f6',
//   submitted: '#8b5cf6',
//   completed: '#22c55e'
// };

// const STATUS_LABELS = {
//   scheduled: 'Scheduled',
//   in_progress: 'In Progress',
//   submitted: 'Submitted',
//   completed: 'Completed'
// };

// export default function TestsPage() {
//   const { data: session, status: sessionStatus } = useSession();
//   const [tests, setTests] = useState([]);
//   const [interns, setInterns] = useState([]);
//   const [departments, setDepts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [addOpen, setAddOpen] = useState(false);
//   const [activeTest, setActiveTest] = useState(null);
//   const [testQuestions, setTestQuestions] = useState([]);
//   const [testResponses, setTestResponses] = useState([]);
//   const [testResults, setTestResults] = useState(null);
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [currentTime, setCurrentTime] = useState(new Date());

//   // Update current time every second for live countdowns
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const showToast = (msg, ok = true) => {
//     setToast({ msg, ok });
//     setTimeout(() => setToast(null), 3000);
//   };

//   const userRole = session?.user?.role;
//   const canCreate = ['admin', 'hr', 'mentor'].includes(userRole);
//   const isIntern = userRole === 'intern';

//   const loadTests = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await fetch('/api/ai-tests');
//       const data = await res.json();
//       if (data.ok) {
//         setTests(data.tests || []);
//       } else {
//         showToast(data.error || 'Failed to load tests', false);
//       }
//     } catch (error) {
//       console.error('Load tests error:', error);
//       showToast('Failed to load tests', false);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadInterns = useCallback(async () => {
//     try {
//       const res = await fetch('/api/interns');
//       const data = await res.json();
//       setInterns(data.interns || []);
//     } catch (error) {
//       console.error('Failed to load interns', error);
//     }
//   }, []);

//   const loadDepartments = useCallback(async () => {
//     try {
//       const res = await fetch('/api/departments');
//       const data = await res.json();
//       setDepts(data?.data?.departments || []);
//     } catch (error) {
//       console.error('Failed to load departments', error);
//     }
//   }, []);

//   useEffect(() => {
//     if (sessionStatus === 'authenticated') {
//       loadTests();
//       if (canCreate) {
//         loadInterns();
//         loadDepartments();
//       }
//     }
//   }, [sessionStatus, loadTests, loadInterns, loadDepartments, canCreate]);

//   const handleCreateTest = async (formData) => {
//     setSaving(true);
//     try {
//       const res = await fetch('/api/ai-tests', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       });
//       const data = await res.json();
//       if (!data.ok) throw new Error(data.error);
//       showToast(data.message);
//       setAddOpen(false);
//       loadTests();
//     } catch (error) {
//       showToast(error.message, false);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleStartTest = async (testId) => {
//     try {
//       const res = await fetch(`/api/ai-tests/${testId}`);
//       const data = await res.json();
//       if (data.ok) {
//         setActiveTest(data.test);
//         setTestQuestions(data.questions);
//         setTestResponses(data.responses);
//         setTestResults(data.results);
//       } else {
//         showToast(data.error || 'Failed to load test', false);
//       }
//     } catch (error) {
//       showToast('Failed to load test', false);
//     }
//   };

//   const handleSubmitTest = async (answers) => {
//     try {
//       const res = await fetch(`/api/ai-tests/${activeTest.id}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ answers })
//       });
//       const data = await res.json();
//       if (data.ok) {
//         showToast('Test submitted successfully!');
//         setActiveTest(null);
//         loadTests();
//       } else {
//         throw new Error(data.error);
//       }
//     } catch (error) {
//       showToast(error.message, false);
//     }
//   };

//   // Helper function to calculate and format remaining time
//   const getRemainingTime = (scheduledAt, durationMinutes) => {
//     const now = currentTime;
//     const startTime = new Date(scheduledAt);
//     const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000);
    
//     // Test hasn't started yet
//     if (now < startTime) {
//       const timeUntilStart = startTime - now;
//       const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
//       const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((timeUntilStart % (1000 * 60)) / 1000);
      
//       if (hours > 0) {
//         return { type: 'starts_in', text: `Starts in ${hours}h ${minutes}m`, full: `${hours}h ${minutes}m ${seconds}s` };
//       } else if (minutes > 0) {
//         return { type: 'starts_in', text: `Starts in ${minutes}m ${seconds}s`, full: `${minutes}m ${seconds}s` };
//       } else {
//         return { type: 'starts_in', text: `Starts in ${seconds}s`, full: `${seconds}s` };
//       }
//     }
    
//     // Test is in progress
//     if (now <= endTime) {
//       const remaining = endTime - now;
//       const hours = Math.floor(remaining / (1000 * 60 * 60));
//       const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
//       if (hours > 0) {
//         return { type: 'remaining', text: `${hours}h ${minutes}m remaining`, full: `${hours}h ${minutes}m ${seconds}s remaining` };
//       } else {
//         return { type: 'remaining', text: `${minutes}m ${seconds}s remaining`, full: `${minutes}m ${seconds}s remaining` };
//       }
//     }
    
//     // Test has expired
//     return { type: 'expired', text: 'Expired', full: 'Test time has expired' };
//   };

//   // Helper to get color based on remaining time
//   const getTimerColor = (scheduledAt, durationMinutes) => {
//     const now = currentTime;
//     const startTime = new Date(scheduledAt);
//     const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000);
    
//     if (now < startTime) {
//       return 'var(--status-progress)';
//     }
    
//     if (now <= endTime) {
//       const remaining = endTime - now;
//       const minutesLeft = Math.floor(remaining / 60000);
//       if (minutesLeft < 5) {
//         return 'var(--status-terminated)';
//       } else if (minutesLeft < 10) {
//         return 'var(--status-progress)';
//       }
//       return 'var(--status-active)';
//     }
    
//     return 'var(--text-muted)';
//   };

//   // Get status with live timer
//   const getStatusWithTimer = (test) => {
//     const now = currentTime;
//     const startTime = new Date(test.scheduled_at);
//     const endTime = new Date(startTime.getTime() + (test.duration_minutes || 30) * 60000);
    
//     if (test.status === 'completed') {
//       return { status: 'completed', text: 'Completed', color: 'var(--status-active)', isLive: false };
//     }
    
//     if (now < startTime) {
//       const remaining = getRemainingTime(test.scheduled_at, test.duration_minutes);
//       return { 
//         status: 'upcoming', 
//         text: remaining.text, 
//         color: 'var(--status-progress)',
//         isLive: true,
//         fullText: remaining.full
//       };
//     }
    
//     if (now <= endTime) {
//       const remaining = getRemainingTime(test.scheduled_at, test.duration_minutes);
//       return { 
//         status: 'active', 
//         text: remaining.text, 
//         color: getTimerColor(test.scheduled_at, test.duration_minutes),
//         isLive: true,
//         fullText: remaining.full
//       };
//     }
    
//     return { status: 'expired', text: 'Expired', color: 'var(--status-terminated)', isLive: false };
//   };

//   const getStatusBadge = (status) => {
//     return (
//       <span style={{
//         display: 'inline-flex', padding: '4px 12px', borderRadius: '99px',
//         fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
//         background: `${STATUS_COLORS[status]}22`,
//         color: STATUS_COLORS[status]
//       }}>
//         {STATUS_LABELS[status] || status}
//       </span>
//     );
//   };

//   const getActionButton = (test) => {
//     const now = currentTime;
//     const scheduledAt = new Date(test.scheduled_at);
//     const endTime = new Date(scheduledAt.getTime() + (test.duration_minutes || 30) * 60000);
    
//     // If test is completed, show results
//     if (test.status === 'completed' && test.percentage !== null) {
//       return (
//         <button
//           className="btn-ghost"
//           onClick={() => handleStartTest(test.id)}
//           style={{ fontSize: '12px', padding: '6px 12px' }}
//         >
//           View Results
//         </button>
//       );
//     }
    
//     // If test is in progress or scheduled
//     if (test.status === 'scheduled' || test.status === 'in_progress') {
//       // Check if test has started
//       if (now < scheduledAt) {
//         const timeUntilStart = scheduledAt - now;
//         const minutes = Math.floor(timeUntilStart / 60000);
//         const seconds = Math.floor((timeUntilStart % 60000) / 1000);
        
//         return (
//           <div style={{ textAlign: 'center' }}>
//             <span style={{ fontSize: '11px', color: 'var(--status-progress)' }}>
//               Starts in {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
//             </span>
//             <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//               {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </p>
//           </div>
//         );
//       } 
//       else if (now <= endTime) {
//         const timeLeft = endTime - now;
//         const minutes = Math.floor(timeLeft / 60000);
//         const seconds = Math.floor((timeLeft % 60000) / 1000);
        
//         return (
//           <div>
//             <button
//               className="btn-primary"
//               onClick={() => handleStartTest(test.id)}
//               style={{ fontSize: '12px', padding: '6px 16px', marginBottom: '4px', width: '100%' }}
//             >
//               Take Test
//             </button>
//             <p style={{ 
//               fontSize: '11px', 
//               color: getTimerColor(test.scheduled_at, test.duration_minutes), 
//               fontFamily: 'monospace',
//               textAlign: 'center'
//             }}>
//               {minutes}:{seconds.toString().padStart(2, '0')} remaining
//             </p>
//           </div>
//         );
//       } 
//       else {
//         return (
//           <div>
//             <span style={{ fontSize: '12px', color: 'var(--status-terminated)' }}>
//               Expired
//             </span>
//             <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//               Ended at {endTime.toLocaleTimeString()}
//             </p>
//           </div>
//         );
//       }
//     }
    
//     return null;
//   };

//   const filteredTests = filterStatus === 'all' 
//     ? tests 
//     : tests.filter(t => t.status === filterStatus);

//   if (sessionStatus === 'loading') {
//     return (
//       <div style={{ padding: '40px', textAlign: 'center' }}>
//         <div className="skeleton" style={{ height: '32px', width: '200px', margin: '0 auto', borderRadius: '8px' }} />
//         <div className="skeleton" style={{ height: '400px', marginTop: '24px', borderRadius: '12px' }} />
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Toast */}
//       {toast && (
//         <div style={{
//           position: 'fixed', bottom: '28px', right: '28px', zIndex: 300,
//           padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
//           background: toast.ok ? 'var(--status-active)' : 'var(--status-terminated)',
//           color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', animation: 'fadeUp 0.25s ease',
//         }}>
//           {toast.msg}
//         </div>
//       )}

//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
//         <div>
//           <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>AI Tests</h1>
//           <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
//             AI-powered assessments with automatic evaluation
//           </p>
//         </div>
//         {canCreate && (
//           <button className="btn-primary" onClick={() => setAddOpen(true)}>
//             <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//             Schedule Test
//           </button>
//         )}
//       </div>

//       {/* Filter tabs */}
//       <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
//         {['all', 'scheduled', 'in_progress', 'completed'].map(status => (
//           <button
//             key={status}
//             onClick={() => setFilterStatus(status)}
//             style={{
//               padding: '6px 14px',
//               borderRadius: '20px',
//               fontSize: '13px',
//               fontWeight: '500',
//               border: '1px solid',
//               cursor: 'pointer',
//               fontFamily: 'var(--font-body)',
//               borderColor: filterStatus === status ? 'var(--accent)' : 'var(--border)',
//               background: filterStatus === status ? 'rgba(26,58,255,0.1)' : 'transparent',
//               color: filterStatus === status ? 'var(--accent)' : 'var(--text-secondary)',
//               transition: 'all 0.15s',
//             }}
//           >
//             {status === 'all' ? 'All Tests' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
//           </button>
//         ))}
//       </div>

//       {/* Tests List */}
//       <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
//         {loading ? (
//           <div style={{ padding: '40px', textAlign: 'center' }}>
//             <div className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }} />
//             <div className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }} />
//             <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />
//           </div>
//         ) : filteredTests.length === 0 ? (
//           <div style={{ padding: '60px', textAlign: 'center' }}>
//             <p style={{ fontSize: '48px', marginBottom: '16px' }}>📝</p>
//             <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
//               {filterStatus !== 'all' ? `No ${filterStatus} tests found.` : 'No tests scheduled yet.'}
//             </p>
//             {canCreate && filterStatus === 'all' && (
//               <button className="btn-primary" onClick={() => setAddOpen(true)}>
//                 Schedule Your First Test
//               </button>
//             )}
//           </div>
//         ) : (
//           <div style={{ overflowX: 'auto' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//               <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
//                 <tr>
//                   <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Test Details</th>
//                   {!isIntern && <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Intern</th>}
//                   <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
//                   <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Score</th>
//                   <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredTests.map((test, idx) => {
//                   const timerInfo = getStatusWithTimer(test);
//                   const remainingTime = getRemainingTime(test.scheduled_at, test.duration_minutes);
                  
//                   return (
//                     <tr 
//                       key={test.id} 
//                       style={{ 
//                         borderBottom: idx < filteredTests.length - 1 ? '1px solid var(--border)' : 'none',
//                         transition: 'background 0.1s'
//                       }}
//                       onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
//                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                     >
//                       <td style={{ padding: '16px 20px' }}>
//                         <div>
//                           <p style={{ fontSize: '14px', fontWeight: '600' }}>
//                             {test.test_type?.toUpperCase()} Test
//                           </p>
//                           <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
//                             {test.total_questions || 0} questions · {test.duration_minutes} min
//                           </p>
//                           <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
//                             📅 {new Date(test.scheduled_at).toLocaleString('en-IN', {
//                               timeZone: 'Asia/Kolkata',
//                               day: '2-digit',
//                               month: '2-digit',
//                               year: 'numeric',
//                               hour: '2-digit',
//                               minute: '2-digit',
//                               hour12: true
//                             })}
//                           </p>
//                           <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//                             Conducted by: {test.conducted_by_name}
//                           </p>
//                         </div>
//                       </td>
//                       {!isIntern && (
//                         <td style={{ padding: '16px 20px' }}>
//                           <p style={{ fontSize: '13px', fontWeight: '500' }}>{test.intern_name || '—'}</p>
//                         </td>
//                       )}
//                       <td style={{ padding: '16px 20px' }}>
//                         <div>
//                           <span style={{
//                             display: 'inline-flex', 
//                             padding: '4px 12px', 
//                             borderRadius: '99px',
//                             fontSize: '11px', 
//                             fontWeight: '600', 
//                             textTransform: 'uppercase',
//                             background: `${timerInfo.color}22`,
//                             color: timerInfo.color,
//                             marginBottom: timerInfo.isLive ? '8px' : '0'
//                           }}>
//                             {timerInfo.text}
//                           </span>
//                           {timerInfo.isLive && remainingTime.type === 'starts_in' && (
//                             <div style={{ marginTop: '4px' }}>
//                               <span style={{ 
//                                 fontSize: '11px', 
//                                 color: 'var(--text-muted)',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '4px'
//                               }}>
//                                 ⏰ {remainingTime.full}
//                               </span>
//                             </div>
//                           )}
//                           {timerInfo.isLive && remainingTime.type === 'remaining' && (
//                             <div style={{ marginTop: '4px' }}>
//                               <span style={{ 
//                                 fontSize: '12px', 
//                                 fontWeight: '600',
//                                 color: timerInfo.color,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '4px',
//                                 fontFamily: 'monospace'
//                               }}>
//                                 ⏱️ {remainingTime.full}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td style={{ padding: '16px 20px' }}>
//                         {test.percentage !== null && test.percentage !== undefined ? (
//                           <div>
//                             <p style={{ fontSize: '18px', fontWeight: '700', color: test.percentage >= 70 ? 'var(--status-active)' : test.percentage >= 50 ? 'var(--status-progress)' : 'var(--status-terminated)' }}>
//                               {test.percentage.toFixed(1)}%
//                             </p>
//                             <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
//                               Grade: {test.grade || '—'}
//                             </p>
//                           </div>
//                         ) : (
//                           <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
//                         )}
//                       </td>
//                       <td style={{ padding: '16px 20px' }}>
//                         {getActionButton(test)}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Create Test Modal */}
//       {addOpen && (
//         <TestModal
//           open={addOpen}
//           interns={interns}
//           departments={departments}
//           onClose={() => setAddOpen(false)}
//           onSave={handleCreateTest}
//           saving={saving}
//         />
//       )}

//       {/* Test Taking Modal */}
//       {activeTest && !testResults && (
//         <div style={{
//           position: 'fixed', inset: 0, zIndex: 300,
//           background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           padding: '24px'
//         }}>
//           <div style={{ width: '100%', maxWidth: '1200px', height: '85vh' }}>
//             <TestTaker
//               test={activeTest}
//               questions={testQuestions}
//               responses={testResponses}
//               onSubmit={handleSubmitTest}
//               onClose={() => {
//                 setActiveTest(null);
//                 setTestQuestions([]);
//                 setTestResponses([]);
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Test Results Modal */}
//       {activeTest && testResults && (
//         <div style={{
//           position: 'fixed', inset: 0, zIndex: 300,
//           background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           padding: '24px'
//         }}>
//           <div style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
//             <TestResults
//               results={testResults}
//               test={activeTest}
//               onClose={() => {
//                 setActiveTest(null);
//                 setTestResults(null);
//                 setTestQuestions([]);
//                 setTestResponses([]);
//                 loadTests();
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// FILE: frontend/app/(protected)/tests/page.jsx
// Simplified MCQ-only version — removed coding/descriptive logic, cleaned up timer and status code

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import TestModal from '@/components/TestModal';
import TestTaker from '@/components/TestTaker';
import TestResults from '@/components/TestResults';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  scheduled:   '#f59e0b',
  in_progress: '#3b82f6',
  submitted:   '#8b5cf6',
  completed:   '#22c55e',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Returns how much time is left (or until start) as a readable string
function getTimeLabel(scheduledAt, durationMinutes) {
  const now    = new Date();
  const start  = new Date(scheduledAt);
  const end    = new Date(start.getTime() + (durationMinutes || 30) * 60000);

  if (now < start) {
    const diff = start - now;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { type: 'upcoming', label: `Starts in ${m}m ${s}s`, color: '#f59e0b' };
  }

  if (now <= end) {
    const diff = end - now;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const color = m < 5 ? '#ef4444' : m < 10 ? '#f59e0b' : '#22c55e';
    return { type: 'active', label: `${m}:${String(s).padStart(2, '0')} left`, color };
  }

  return { type: 'expired', label: 'Expired', color: '#6b7280' };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TestsPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [tests,        setTests]        = useState([]);
  const [interns,      setInterns]      = useState([]);
  const [departments,  setDepts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [activeTest,   setActiveTest]   = useState(null);
  const [testQuestions,setTestQuestions]= useState([]);
  const [testResponses,setTestResponses]= useState([]);
  const [testResults,  setTestResults]  = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [, setTick] = useState(0); // triggers re-render every second for live timers

  const userRole  = session?.user?.role;
  const canCreate = ['admin', 'hr', 'mentor'].includes(userRole);
  const isIntern  = userRole === 'intern';

  // Re-render every second so timers stay live
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/ai-tests');
      const data = await res.json();
      if (data.ok) setTests(data.tests || []);
      else showToast(data.error || 'Failed to load tests', false);
    } catch {
      showToast('Failed to load tests', false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInterns = useCallback(async () => {
    try {
      const res  = await fetch('/api/interns');
      const data = await res.json();
      setInterns(data.interns || []);
    } catch { /* silent */ }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res  = await fetch('/api/departments');
      const data = await res.json();
      setDepts(data?.data?.departments || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    loadTests();
    if (canCreate) { loadInterns(); loadDepartments(); }
  }, [sessionStatus, loadTests, loadInterns, loadDepartments, canCreate]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleCreateTest = async (formData) => {
    setSaving(true);
    try {
      const res  = await fetch('/api/ai-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast(data.message);
      setAddOpen(false);
      loadTests();
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTest = async (testId) => {
    try {
      const res  = await fetch(`/api/ai-tests/${testId}`);
      const data = await res.json();
      if (!data.ok) { showToast(data.error || 'Failed to load test', false); return; }
      setActiveTest(data.test);
      setTestQuestions(data.questions);
      setTestResponses(data.responses);
      setTestResults(data.results);  // null if not completed yet
    } catch {
      showToast('Failed to load test', false);
    }
  };

  const handleSubmitTest = async (answers) => {
    try {
      const res  = await fetch(`/api/ai-tests/${activeTest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast('Test submitted!');
      setActiveTest(null);
      loadTests();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const closeTest = () => {
    setActiveTest(null);
    setTestQuestions([]);
    setTestResponses([]);
    setTestResults(null);
    loadTests();
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  // Action button shown in each row
  const ActionButton = ({ test }) => {
    const now   = new Date();
    const start = new Date(test.scheduled_at);
    const end   = new Date(start.getTime() + (test.duration_minutes || 30) * 60000);
    const timer = getTimeLabel(test.scheduled_at, test.duration_minutes);

    // Completed — show results button
    if (test.status === 'completed') {
      return (
        <button className="btn-ghost" onClick={() => handleOpenTest(test.id)}
          style={{ fontSize: '12px', padding: '6px 12px' }}>
          View Results
        </button>
      );
    }

    // Not started yet
    if (now < start) {
      return (
        <span style={{ fontSize: '12px', color: '#f59e0b' }}>{timer.label}</span>
      );
    }

    // Active — intern can take it
    if (now <= end) {
      return (
        <div>
          <button className="btn-primary" onClick={() => handleOpenTest(test.id)}
            style={{ fontSize: '12px', padding: '6px 16px', width: '100%' }}>
            Take Test
          </button>
          <p style={{ fontSize: '11px', color: timer.color, fontFamily: 'monospace', textAlign: 'center', marginTop: '4px' }}>
            {timer.label}
          </p>
        </div>
      );
    }

    // Expired
    return <span style={{ fontSize: '12px', color: '#6b7280' }}>Expired</span>;
  };

  const filteredTests = filterStatus === 'all'
    ? tests
    : tests.filter(t => t.status === filterStatus);

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (sessionStatus === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', margin: '0 auto 24px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 300,
          padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
          background: toast.ok ? '#22c55e' : '#ef4444',
          color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>AI Tests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            MCQ assessments with automatic grading
          </p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            + Schedule Test
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'scheduled', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
            border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)',
            borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
            background:  filterStatus === s ? 'rgba(26,58,255,0.1)' : 'transparent',
            color:       filterStatus === s ? 'var(--accent)' : 'var(--text-secondary)',
          }}>
            {s === 'all' ? 'All Tests' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tests table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📝</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              {filterStatus !== 'all' ? `No ${filterStatus.replace('_', ' ')} tests.` : 'No tests scheduled yet.'}
            </p>
            {canCreate && filterStatus === 'all' && (
              <button className="btn-primary" onClick={() => setAddOpen(true)}>Schedule First Test</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  {['Test Details', !isIntern && 'Intern', 'Timer', 'Score', 'Action']
                    .filter(Boolean)
                    .map(col => (
                      <th key={col} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, idx) => {
                  const timer      = getTimeLabel(test.scheduled_at, test.duration_minutes);
                  const statusColor = STATUS_COLORS[test.status] || '#6b7280';

                  return (
                    <tr key={test.id}
                      style={{ borderBottom: idx < filteredTests.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Test details */}
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600' }}>MCQ Test</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {test.total_questions || 0} questions · {test.duration_minutes} min
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          📅 {new Date(test.scheduled_at).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit',
                            year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          By: {test.conducted_by_name}
                        </p>
                      </td>

                      {/* Intern name (hidden for intern role) */}
                      {!isIntern && (
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '500' }}>{test.intern_name || '—'}</p>
                        </td>
                      )}

                      {/* Live timer + status badge */}
                      <td style={{ padding: '16px 20px' }}>
                        {/* Status badge */}
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px', borderRadius: '99px',
                          fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                          background: `${statusColor}22`, color: statusColor, marginBottom: '6px',
                        }}>
                          {test.status.replace('_', ' ')}
                        </span>
                        {/* Live countdown (only for non-completed tests) */}
                        {test.status !== 'completed' && (
                          <p style={{ fontSize: '12px', color: timer.color, fontFamily: 'monospace' }}>
                            {timer.label}
                          </p>
                        )}
                      </td>

                      {/* Score */}
                      <td style={{ padding: '16px 20px' }}>
                        {test.percentage != null ? (
                          <div>
                            <p style={{
                              fontSize: '18px', fontWeight: '700',
                              color: test.percentage >= 70 ? '#22c55e' : test.percentage >= 50 ? '#f59e0b' : '#ef4444',
                            }}>
                              {test.percentage.toFixed(1)}%
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grade: {test.grade || '—'}</p>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Action button */}
                      <td style={{ padding: '16px 20px' }}>
                        <ActionButton test={test} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Schedule new test */}
      {addOpen && (
        <TestModal
          open={addOpen}
          interns={interns}
          departments={departments}
          onClose={() => setAddOpen(false)}
          onSave={handleCreateTest}
          saving={saving}
        />
      )}

      {/* Test taking interface */}
      {activeTest && !testResults && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ width: '100%', maxWidth: '1200px', height: '85vh' }}>
            <TestTaker
              test={activeTest}
              questions={testQuestions}
              responses={testResponses}
              onSubmit={handleSubmitTest}
              onClose={closeTest}
            />
          </div>
        </div>
      )}

      {/* Results view */}
      {activeTest && testResults && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <TestResults
              results={testResults}
              test={activeTest}
              onClose={closeTest}
            />
          </div>
        </div>
      )}

    </div>
  );
}