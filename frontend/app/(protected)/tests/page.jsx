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

//   // In app/tests/page.jsx - Update the getActionButton function

// const getActionButton = (test) => {
//   const now = new Date();
//   const scheduledAt = new Date(test.scheduled_at);
//   const endTime = new Date(scheduledAt.getTime() + (test.duration_minutes || 30) * 60000);
  
//   // Debug logging
//   console.log('Test timing:', {
//     id: test.id,
//     now: now.toISOString(),
//     scheduledAt: scheduledAt.toISOString(),
//     endTime: endTime.toISOString(),
//     status: test.status,
//     isPast: now > scheduledAt,
//     isExpired: now > endTime
//   });
  
//   // If test is completed, show results
//   if (test.status === 'completed' && test.percentage !== null) {
//     return (
//       <button
//         className="btn-ghost"
//         onClick={() => handleStartTest(test.id)}
//         style={{ fontSize: '12px', padding: '6px 12px' }}
//       >
//         View Results
//       </button>
//     );
//   }
  
//   // If test is in progress or scheduled
//   if (test.status === 'scheduled' || test.status === 'in_progress') {
//     // Check if test has started
//     if (now < scheduledAt) {
//       // Test not started yet - show countdown or start time
//       const timeUntilStart = scheduledAt - now;
//       const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));
//       const minutesUntilStart = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      
//       let startTimeText = '';
//       if (hoursUntilStart > 24) {
//         const daysUntilStart = Math.floor(hoursUntilStart / 24);
//         startTimeText = `Starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`;
//       } else if (hoursUntilStart > 0) {
//         startTimeText = `Starts in ${hoursUntilStart}h ${minutesUntilStart}m`;
//       } else if (minutesUntilStart > 0) {
//         startTimeText = `Starts in ${minutesUntilStart} minutes`;
//       } else {
//         startTimeText = `Starts at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
//       }
      
//       return (
//         <div style={{ textAlign: 'center' }}>
//           <span style={{ fontSize: '11px', color: 'var(--status-progress)' }}>
//             {startTimeText}
//           </span>
//           <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//             {scheduledAt.toLocaleDateString()} at {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//           </p>
//         </div>
//       );
//     } 
//     else if (now <= endTime) {
//       // Test is active - show "Take Test" button
//       const timeLeft = endTime - now;
//       const minutesLeft = Math.floor(timeLeft / 60000);
//       const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
      
//       return (
//         <div>
//           <button
//             className="btn-primary"
//             onClick={() => handleStartTest(test.id)}
//             style={{ fontSize: '12px', padding: '6px 16px', marginBottom: '4px' }}
//           >
//             Take Test
//           </button>
//           <p style={{ fontSize: '10px', color: 'var(--status-progress)' }}>
//             {minutesLeft}:{secondsLeft.toString().padStart(2, '0')} remaining
//           </p>
//         </div>
//       );
//     } 
//     else {
//       // Test has expired
//       return (
//         <div>
//           <span style={{ fontSize: '12px', color: 'var(--status-terminated)' }}>
//             Expired
//           </span>
//           <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//             Ended at {endTime.toLocaleTimeString()}
//           </p>
//         </div>
//       );
//     }
//   }
  
//   return null;
// };

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
//                 {filteredTests.map((test, idx) => (
//                   <tr 
//                     key={test.id} 
//                     style={{ 
//                       borderBottom: idx < filteredTests.length - 1 ? '1px solid var(--border)' : 'none',
//                       transition: 'background 0.1s'
//                     }}
//                     onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
//                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                   >
//                     <td style={{ padding: '16px 20px' }}>
//                       <div>
//                         <p style={{ fontSize: '14px', fontWeight: '600' }}>
//                           {test.test_type?.toUpperCase()} Test
//                         </p>
//                         <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
//                           {test.total_questions || 0} questions · {test.duration_minutes} min
//                         </p>
//                         <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
//                           {new Date(test.scheduled_at).toLocaleDateString()} at {new Date(test.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                         </p>
//                         <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
//                           Conducted by: {test.conducted_by_name}
//                         </p>
//                       </div>
//                     </td>
//                     {!isIntern && (
//                       <td style={{ padding: '16px 20px' }}>
//                         <p style={{ fontSize: '13px', fontWeight: '500' }}>{test.intern_name || '—'}</p>
//                       </td>
//                     )}
//                     <td style={{ padding: '16px 20px' }}>
//                       {getStatusBadge(test.status)}
//                     </td>
//                     <td style={{ padding: '16px 20px' }}>
//                       {test.percentage !== null && test.percentage !== undefined ? (
//                         <div>
//                           <p style={{ fontSize: '18px', fontWeight: '700', color: test.percentage >= 70 ? 'var(--status-active)' : test.percentage >= 50 ? 'var(--status-progress)' : 'var(--status-terminated)' }}>
//                             {test.percentage.toFixed(1)}%
//                           </p>
//                           <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
//                             Grade: {test.grade || '—'}
//                           </p>
//                         </div>
//                       ) : (
//                         <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
//                       )}
//                     </td>
//                     <td style={{ padding: '16px 20px' }}>
//                       {getActionButton(test)}
//                     </td>
//                   </tr>
//                 ))}
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TestModal from '@/components/TestModal';
import TestTaker from '@/components/TestTaker';
import TestResults from '@/components/TestResults';

const STATUS_COLORS = {
  scheduled: '#f59e0b',
  in_progress: '#3b82f6',
  submitted: '#8b5cf6',
  completed: '#22c55e'
};

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  completed: 'Completed'
};

export default function TestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [tests, setTests] = useState([]);
  const [interns, setInterns] = useState([]);
  const [departments, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testResponses, setTestResponses] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const userRole = session?.user?.role;
  const canCreate = ['admin', 'hr', 'mentor'].includes(userRole);
  const isIntern = userRole === 'intern';

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-tests');
      const data = await res.json();
      if (data.ok) {
        setTests(data.tests || []);
      } else {
        showToast(data.error || 'Failed to load tests', false);
      }
    } catch (error) {
      console.error('Load tests error:', error);
      showToast('Failed to load tests', false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInterns = useCallback(async () => {
    try {
      const res = await fetch('/api/interns');
      const data = await res.json();
      setInterns(data.interns || []);
    } catch (error) {
      console.error('Failed to load interns', error);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepts(data?.data?.departments || []);
    } catch (error) {
      console.error('Failed to load departments', error);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadTests();
      if (canCreate) {
        loadInterns();
        loadDepartments();
      }
    }
  }, [sessionStatus, loadTests, loadInterns, loadDepartments, canCreate]);

  const handleCreateTest = async (formData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast(data.message);
      setAddOpen(false);
      loadTests();
    } catch (error) {
      showToast(error.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleStartTest = async (testId) => {
    try {
      const res = await fetch(`/api/ai-tests/${testId}`);
      const data = await res.json();
      if (data.ok) {
        setActiveTest(data.test);
        setTestQuestions(data.questions);
        setTestResponses(data.responses);
        setTestResults(data.results);
      } else {
        showToast(data.error || 'Failed to load test', false);
      }
    } catch (error) {
      showToast('Failed to load test', false);
    }
  };

  const handleSubmitTest = async (answers) => {
    try {
      const res = await fetch(`/api/ai-tests/${activeTest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Test submitted successfully!');
        setActiveTest(null);
        loadTests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast(error.message, false);
    }
  };

  // Helper function to calculate and format remaining time
  const getRemainingTime = (scheduledAt, durationMinutes) => {
    const now = currentTime;
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000);
    
    // Test hasn't started yet
    if (now < startTime) {
      const timeUntilStart = startTime - now;
      const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilStart % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        return { type: 'starts_in', text: `Starts in ${hours}h ${minutes}m`, full: `${hours}h ${minutes}m ${seconds}s` };
      } else if (minutes > 0) {
        return { type: 'starts_in', text: `Starts in ${minutes}m ${seconds}s`, full: `${minutes}m ${seconds}s` };
      } else {
        return { type: 'starts_in', text: `Starts in ${seconds}s`, full: `${seconds}s` };
      }
    }
    
    // Test is in progress
    if (now <= endTime) {
      const remaining = endTime - now;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        return { type: 'remaining', text: `${hours}h ${minutes}m remaining`, full: `${hours}h ${minutes}m ${seconds}s remaining` };
      } else {
        return { type: 'remaining', text: `${minutes}m ${seconds}s remaining`, full: `${minutes}m ${seconds}s remaining` };
      }
    }
    
    // Test has expired
    return { type: 'expired', text: 'Expired', full: 'Test time has expired' };
  };

  // Helper to get color based on remaining time
  const getTimerColor = (scheduledAt, durationMinutes) => {
    const now = currentTime;
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000);
    
    if (now < startTime) {
      return 'var(--status-progress)';
    }
    
    if (now <= endTime) {
      const remaining = endTime - now;
      const minutesLeft = Math.floor(remaining / 60000);
      if (minutesLeft < 5) {
        return 'var(--status-terminated)';
      } else if (minutesLeft < 10) {
        return 'var(--status-progress)';
      }
      return 'var(--status-active)';
    }
    
    return 'var(--text-muted)';
  };

  // Get status with live timer
  const getStatusWithTimer = (test) => {
    const now = currentTime;
    const startTime = new Date(test.scheduled_at);
    const endTime = new Date(startTime.getTime() + (test.duration_minutes || 30) * 60000);
    
    if (test.status === 'completed') {
      return { status: 'completed', text: 'Completed', color: 'var(--status-active)', isLive: false };
    }
    
    if (now < startTime) {
      const remaining = getRemainingTime(test.scheduled_at, test.duration_minutes);
      return { 
        status: 'upcoming', 
        text: remaining.text, 
        color: 'var(--status-progress)',
        isLive: true,
        fullText: remaining.full
      };
    }
    
    if (now <= endTime) {
      const remaining = getRemainingTime(test.scheduled_at, test.duration_minutes);
      return { 
        status: 'active', 
        text: remaining.text, 
        color: getTimerColor(test.scheduled_at, test.duration_minutes),
        isLive: true,
        fullText: remaining.full
      };
    }
    
    return { status: 'expired', text: 'Expired', color: 'var(--status-terminated)', isLive: false };
  };

  const getStatusBadge = (status) => {
    return (
      <span style={{
        display: 'inline-flex', padding: '4px 12px', borderRadius: '99px',
        fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
        background: `${STATUS_COLORS[status]}22`,
        color: STATUS_COLORS[status]
      }}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  const getActionButton = (test) => {
    const now = currentTime;
    const scheduledAt = new Date(test.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + (test.duration_minutes || 30) * 60000);
    
    // If test is completed, show results
    if (test.status === 'completed' && test.percentage !== null) {
      return (
        <button
          className="btn-ghost"
          onClick={() => handleStartTest(test.id)}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          View Results
        </button>
      );
    }
    
    // If test is in progress or scheduled
    if (test.status === 'scheduled' || test.status === 'in_progress') {
      // Check if test has started
      if (now < scheduledAt) {
        const timeUntilStart = scheduledAt - now;
        const minutes = Math.floor(timeUntilStart / 60000);
        const seconds = Math.floor((timeUntilStart % 60000) / 1000);
        
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--status-progress)' }}>
              Starts in {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
            </span>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        );
      } 
      else if (now <= endTime) {
        const timeLeft = endTime - now;
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        return (
          <div>
            <button
              className="btn-primary"
              onClick={() => handleStartTest(test.id)}
              style={{ fontSize: '12px', padding: '6px 16px', marginBottom: '4px', width: '100%' }}
            >
              Take Test
            </button>
            <p style={{ 
              fontSize: '11px', 
              color: getTimerColor(test.scheduled_at, test.duration_minutes), 
              fontFamily: 'monospace',
              textAlign: 'center'
            }}>
              {minutes}:{seconds.toString().padStart(2, '0')} remaining
            </p>
          </div>
        );
      } 
      else {
        return (
          <div>
            <span style={{ fontSize: '12px', color: 'var(--status-terminated)' }}>
              Expired
            </span>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Ended at {endTime.toLocaleTimeString()}
            </p>
          </div>
        );
      }
    }
    
    return null;
  };

  const filteredTests = filterStatus === 'all' 
    ? tests 
    : tests.filter(t => t.status === filterStatus);

  if (sessionStatus === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', margin: '0 auto', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '400px', marginTop: '24px', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 300,
          padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
          background: toast.ok ? 'var(--status-active)' : 'var(--status-terminated)',
          color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', animation: 'fadeUp 0.25s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>AI Tests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            AI-powered assessments with automatic evaluation
          </p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Schedule Test
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'scheduled', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              borderColor: filterStatus === status ? 'var(--accent)' : 'var(--border)',
              background: filterStatus === status ? 'rgba(26,58,255,0.1)' : 'transparent',
              color: filterStatus === status ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {status === 'all' ? 'All Tests' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tests List */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📝</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              {filterStatus !== 'all' ? `No ${filterStatus} tests found.` : 'No tests scheduled yet.'}
            </p>
            {canCreate && filterStatus === 'all' && (
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                Schedule Your First Test
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Test Details</th>
                  {!isIntern && <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Intern</th>}
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Score</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, idx) => {
                  const timerInfo = getStatusWithTimer(test);
                  const remainingTime = getRemainingTime(test.scheduled_at, test.duration_minutes);
                  
                  return (
                    <tr 
                      key={test.id} 
                      style={{ 
                        borderBottom: idx < filteredTests.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '600' }}>
                            {test.test_type?.toUpperCase()} Test
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {test.total_questions || 0} questions · {test.duration_minutes} min
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            📅 {new Date(test.scheduled_at).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Conducted by: {test.conducted_by_name}
                          </p>
                        </div>
                      </td>
                      {!isIntern && (
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '500' }}>{test.intern_name || '—'}</p>
                        </td>
                      )}
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <span style={{
                            display: 'inline-flex', 
                            padding: '4px 12px', 
                            borderRadius: '99px',
                            fontSize: '11px', 
                            fontWeight: '600', 
                            textTransform: 'uppercase',
                            background: `${timerInfo.color}22`,
                            color: timerInfo.color,
                            marginBottom: timerInfo.isLive ? '8px' : '0'
                          }}>
                            {timerInfo.text}
                          </span>
                          {timerInfo.isLive && remainingTime.type === 'starts_in' && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '11px', 
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ⏰ {remainingTime.full}
                              </span>
                            </div>
                          )}
                          {timerInfo.isLive && remainingTime.type === 'remaining' && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '12px', 
                                fontWeight: '600',
                                color: timerInfo.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontFamily: 'monospace'
                              }}>
                                ⏱️ {remainingTime.full}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {test.percentage !== null && test.percentage !== undefined ? (
                          <div>
                            <p style={{ fontSize: '18px', fontWeight: '700', color: test.percentage >= 70 ? 'var(--status-active)' : test.percentage >= 50 ? 'var(--status-progress)' : 'var(--status-terminated)' }}>
                              {test.percentage.toFixed(1)}%
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Grade: {test.grade || '—'}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {getActionButton(test)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Test Modal */}
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

      {/* Test Taking Modal */}
      {activeTest && !testResults && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ width: '100%', maxWidth: '1200px', height: '85vh' }}>
            <TestTaker
              test={activeTest}
              questions={testQuestions}
              responses={testResponses}
              onSubmit={handleSubmitTest}
              onClose={() => {
                setActiveTest(null);
                setTestQuestions([]);
                setTestResponses([]);
              }}
            />
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {activeTest && testResults && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <TestResults
              results={testResults}
              test={activeTest}
              onClose={() => {
                setActiveTest(null);
                setTestResults(null);
                setTestQuestions([]);
                setTestResponses([]);
                loadTests();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}