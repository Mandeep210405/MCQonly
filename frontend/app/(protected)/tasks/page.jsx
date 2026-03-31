'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { getTasks, createTask, updateTask, deleteTask } from '@/services/TaskApi'
import { getInterns } from '@/services/InternApi'
import { Plus, LayoutGrid, List, MoreVertical, Edit2, Trash2, Calendar, User, AlignLeft, AlertCircle, ChevronRight, CheckCircle2, X, Search, Filter } from 'lucide-react'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-500', dotColor: 'bg-slate-400', borderColor: 'border-slate-200' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500', dotColor: 'bg-amber-400', borderColor: 'border-amber-200' },
  { key: 'in_review', label: 'In Review', color: 'bg-blue-500', dotColor: 'bg-blue-400', borderColor: 'border-blue-200' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500', dotColor: 'bg-emerald-400', borderColor: 'border-emerald-200' },
]

const PRIORITIES = [
  { key: 'low', label: 'Low', color: 'text-emerald-600 bg-emerald-100/50 border-emerald-200', dot: 'bg-emerald-500' },
  { key: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-100/50 border-amber-200', dot: 'bg-amber-500' },
  { key: 'high', label: 'High', color: 'text-rose-600 bg-rose-100/50 border-rose-200', dot: 'bg-rose-500' },
]

const taskSchema = z.object({
  title: z.string().min(1, "Task Title is required").max(200, "Title is too long"),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional().nullable(),
  intern_id: z.string().uuid("Please select a valid intern").min(1, "Assigning to an intern is required")
});

export default function TasksPage() {
  const { data: session } = useSession()
  const isIntern = session?.user?.role === 'intern'

  const [tasks, setTasks] = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, internsRes] = await Promise.all([getTasks(), getInterns()])
      setTasks(tasksRes?.tasks || [])
      setInterns(internsRes?.interns || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      intern_id: ''
    },
    validate: (values) => {
      const result = taskSchema.safeParse(values);
      const errors = {};
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message;
        });
      }
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      if (isIntern) return;

      try {
        const payload = {
          ...values,
          due_date: values.due_date || null,
          intern_id: values.intern_id || null
        }
        if (editingTask) {
          await updateTask(editingTask.id, payload)
        } else {
          await createTask(payload)
        }
        await fetchData()
        closeModal()
      } catch (err) {
        console.error(err)
        alert("Failed to save task")
      } finally {
        setSubmitting(false)
      }
    }
  });

  const openModal = (task = null) => {
    if (isIntern) return // Interns cannot open the edit modal

    if (task) {
      setEditingTask(task)
      formik.setValues({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        intern_id: task.intern?.id || ''
      });
    } else {
      setEditingTask(null)
      formik.resetForm();
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
    formik.resetForm();
  }

  const handleDelete = async (id) => {
    if (isIntern) return
    try {
      await deleteTask(id)
      await fetchData()
      setConfirmDelete(null)
    } catch (err) {
      console.error(err)
      alert("Failed to delete task")
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
      await updateTask(id, { status: newStatus })
      await fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    }
  }

  const filteredTasks = tasks.filter(task => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = 
      task.title?.toLowerCase().includes(search) ||
      task.intern?.userByUserId?.name?.toLowerCase().includes(search) ||
      task.intern?.department?.name?.toLowerCase().includes(search)
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const byStatus = (status) => tasks.filter(t => t.status === status)

  const TaskCard = ({ task }) => {
    const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    const priority = PRIORITIES.find(p => p.key === task.priority) || PRIORITIES[1]

    // Logic for direct quick status update
    const currentStatusIndex = COLUMNS.findIndex(c => c.key === task.status)
    const nextStatus = COLUMNS[currentStatusIndex + 1]

    return (
      <div className={`group bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-all duration-200 ${!isIntern && 'hover:shadow-md hover:border-indigo-200 cursor-pointer'} relative flex flex-col gap-3`}
        onDoubleClick={() => openModal(task)}>

        {!isIntern && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-slate-100 p-1 z-10">
            <button onClick={(e) => { e.stopPropagation(); openModal(task); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(task.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14} /></button>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border ${priority.color} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
              {priority.label}
            </span>
            {overdue && <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wide border border-rose-200">Overdue</span>}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug pr-8">{task.title}</h3>
        </div>

        {task.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed flex gap-1.5 mt-1">
            <AlignLeft size={14} className="shrink-0 text-slate-400 mt-0.5" />
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          {!isIntern ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 rounded-full pr-2.5 py-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200 uppercase shrink-0">
                {(task.intern?.userByUserId?.name || 'U').charAt(0)}
              </div>
              <span className="truncate max-w-[90px]">{task.intern?.userByUserId?.name || 'Unassigned'}</span>
            </div>
          ) : (
            // If intern is viewing their own card, show a quick status advance button instead
            <div className="flex-1">
              {nextStatus ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, nextStatus.key); }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-100/50"
                >
                  Move to {nextStatus.label} <ChevronRight size={12} />
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
            </div>
          )}

          {task.due_date && (
            <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-md ${overdue ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-slate-500'} ${isIntern && 'ml-auto'}`}>
              <Calendar size={12} className={overdue ? 'text-rose-500' : 'text-slate-400'} />
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {view === 'kanban' ? tasks.length : filteredTasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-slate-200/50 p-1 rounded-lg w-full sm:w-auto">
              <button onClick={() => setView('kanban')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'kanban' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                <LayoutGrid size={16} /> Kanban
              </button>
              <button onClick={() => setView('list')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                <List size={16} /> List
              </button>
            </div>
            {view === 'kanban' && !isIntern && (
              <button onClick={() => openModal()} className="flex w-full sm:w-auto items-center justify-center gap-2 bg-(--accent) hover:bg-(--accent-2) text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-(--accent-2) shrink-0">
                <Plus size={18} /> New Task
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar - Only show in List View, sync UI with Users Page */}
        {view === 'list' && (
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-1 flex-col md:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by task, intern, or department..."
                  className="w-full pl-10 bg-white pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/20 focus:border-[#1a3aff] transition-all duration-200 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-44">
                  <select
                    className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/20 focus:border-[#1a3aff] transition-all text-sm appearance-none cursor-pointer text-slate-700 font-medium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>

                <div className="relative flex-1 md:w-44">
                  <select
                    className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/20 focus:border-[#1a3aff] transition-all text-sm appearance-none cursor-pointer text-slate-700 font-medium"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">All Priority</option>
                    {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>
            </div>

            {!isIntern && (
              <button 
                onClick={() => openModal()} 
                className="bg-(--accent) text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-(--accent-2) hover:bg-(--accent-2) transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Plus size={18} /> New Task
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-6 overflow-x-auto pb-6">
          {COLUMNS.map(col => (
            <div key={col.key} className={`shrink-0 w-80 bg-white rounded-2xl p-4 border ${col.borderColor}`}>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} shadow-sm`}></span>
                  <h2 className="text-sm font-bold text-slate-700 tracking-wide">{col.label}</h2>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white border ${col.borderColor} text-slate-600 shadow-sm`}>{byStatus(col.key).length}</span>
              </div>
              <div className="flex flex-col gap-3 min-h-[150px]">
                {byStatus(col.key).length === 0 ? (
                  <div className={`h-24 rounded-xl border-2 ${col.borderColor} flex items-center justify-center text-xs font-medium text-slate-400 bg-white/40`}>
                    Drop tasks here
                  </div>
                ) : (
                  byStatus(col.key).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[40%]">Task Detail</th>
                  {!isIntern && <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Assigned Intern</th>}
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status & Priority</th>
                  {!isIntern && <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const priority = PRIORITIES.find(p => p.key === task.priority) || PRIORITIES[1]
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 min-w-2 h-2 rounded-full ${priority.dot}`}></div>
                          <div>
                            <p className={`text-sm font-semibold text-slate-900 transition-colors ${!isIntern && 'group-hover:text-indigo-600 cursor-pointer'}`} onClick={() => openModal(task)}>{task.title}</p>
                            {task.due_date && <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                          </div>
                        </div>
                      </td>

                      {!isIntern && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100 uppercase">
                              {(task.intern?.userByUserId?.name || 'U').charAt(0)}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-slate-700 block">{task.intern?.userByUserId?.name || 'Unassigned'}</span>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{task.intern?.department?.name || 'No Dept'}</span>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-start">
                          <select
                            className="text-xs font-bold rounded-lg border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          >
                            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${priority.color} flex items-center gap-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                            {priority.label}
                          </span>
                        </div>
                      </td>

                      {!isIntern && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(task)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(task.id); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={isIntern ? 3 : 4} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No matching tasks' : 'No tasks yet'}</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                          ? "Try adjusting your search or filters to find what you're looking for." 
                          : isIntern ? "You're all caught up! No tasks assigned to you right now." : "Get started by creating a new task to assign to your interns."}
                      </p>
                      {!isIntern && (
                        <button onClick={() => openModal()} className="mt-4 inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                          <Plus size={16} /> Create Task
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-110">
          <div className="bg-white w-full max-w-sm p-5 rounded-2xl animate-fadeUp">
            <h2 className="text-xl font-bold mb-2">Confirm Delete</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this task?</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600 transition-all duration-200"
                onClick={() => handleDelete(confirmDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task form modal (Hidden for Interns automatically via logic) */}
      {isModalOpen && !isIntern && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button type="button" onClick={closeModal} className="btn-icon p-1 hover:bg-gray-100 rounded-md transition-colors" style={{ flexShrink: 0, marginLeft: "12px" }}><X size={20} /></button>
            </div>
            <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Task Title *</label>
                  <input type="text" className={`w-full px-4 py-2.5 bg-white border ${formik.touched.title && formik.errors.title ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm outline-none placeholder:text-slate-400 shadow-sm`}
                    placeholder="E.g., Design homepage mockup" name="title" value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  {formik.touched.title && formik.errors.title && (
                    <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.title}</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Description</label>
                  <textarea rows="3" className={`w-full px-4 py-2.5 bg-white border ${formik.touched.description && formik.errors.description ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm outline-none resize-none placeholder:text-slate-400 shadow-sm`}
                    placeholder="Add more details about this task..." name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.description}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select className={`w-full px-4 py-2.5 bg-white border ${formik.touched.status && formik.errors.status ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm`}
                        name="status" value={formik.values.status} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <MoreVertical size={16} />
                      </div>
                    </div>
                    {formik.touched.status && formik.errors.status && (
                      <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.status}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Priority</label>
                    <div className="relative">
                      <select className={`w-full px-4 py-2.5 bg-white border ${formik.touched.priority && formik.errors.priority ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm`}
                        name="priority" value={formik.values.priority} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                        {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <MoreVertical size={16} />
                      </div>
                    </div>
                    {formik.touched.priority && formik.errors.priority && (
                      <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.priority}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Due Date</label>
                    <input type="date" className={`w-full px-4 py-2.5 bg-white border ${formik.touched.due_date && formik.errors.due_date ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm outline-none cursor-text text-slate-700 shadow-sm`}
                      name="due_date" value={formik.values.due_date} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    {formik.touched.due_date && formik.errors.due_date && (
                      <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.due_date}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Assign To *</label>
                    <div className="relative">
                      <select className={`w-full px-4 py-2.5 bg-white border ${formik.touched.intern_id && formik.errors.intern_id ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all text-sm font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm`}
                        name="intern_id" value={formik.values.intern_id} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                        <option value="" disabled>Select an Intern...</option>
                        {interns.map(i => <option key={i.id} value={i.id}>{i.userByUserId?.name || i.id}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <MoreVertical size={16} />
                      </div>
                    </div>
                    {formik.touched.intern_id && formik.errors.intern_id && (
                      <div className="text-red-500 text-[11px] font-medium mt-1.5">{formik.errors.intern_id}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={formik.isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                  {formik.isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}