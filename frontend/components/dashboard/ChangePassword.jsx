import { changePasswordSchema } from '@/lib/validations/changePassword'
import { changePassword } from '@/services/UserApi'
import { useFormik } from 'formik'
import React from 'react'
import { X } from 'lucide-react'
import { zodToFormikValidate } from '@/utils/zodToFormik'

function ChangePassword({ userId, onClose }) {
    const { values, handleChange, handleSubmit, touched, errors, handleBlur, isSubmitting } = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        },
        validate: zodToFormikValidate(changePasswordSchema),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await changePassword(userId, values.currentPassword, values.newPassword, values.confirmPassword)
                if (onClose) onClose()
            } catch (error) {
                console.error(error)
            } finally {
                setSubmitting(false)
            }
        }
    })

    return (
        <div
            className="fixed inset-0 z-1000 bg-[#0a0f2e]/55 backdrop-blur-md flex items-start justify-center p-6 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
        >
            <div className="animate-fadeUp bg-white rounded-[24px] w-full max-w-[520px] border border-gray-200 shadow-lg my-auto">
                <div className="pt-6 px-[26px] flex justify-between items-start">
                    <div>
                        <h2 className="text-[20px] font-bold">
                            Change Password
                        </h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                            Update your account password securely
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors shrink-0 ml-3">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-[26px] pt-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3.5">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Current Password *</label>
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="Enter current password"
                                value={values.currentPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                            />
                            {touched.currentPassword && errors.currentPassword && (
                                <div className="text-[#ef4444] text-[12px] mt-1">{errors.currentPassword}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">New Password *</label>
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="Enter new password"
                                value={values.newPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                            />
                            {touched.newPassword && errors.newPassword && (
                                <div className="text-[#ef4444] text-[12px] mt-1">{errors.newPassword}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Confirm New Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Re-type new password"
                                value={values.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                            />
                            {touched.confirmPassword && errors.confirmPassword && (
                                <div className="text-[#ef4444] text-[12px] mt-1">{errors.confirmPassword}</div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2.5 flex gap-2.5 justify-end">
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#1a3aff] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 transition-all duration-200 disabled:opacity-70"
                        >
                            {isSubmitting ? "Changing..." : "Change Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChangePassword
