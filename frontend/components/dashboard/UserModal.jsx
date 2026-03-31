"use client";

import { useRef, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import { createUser, updateUser } from "@/services/UserApi";
import { X } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "hr", "mentor", "intern"], { errorMap: () => ({ message: "Please select a valid role" }) }),
  password: z.string().optional(),
});

export default function UserModal({ mode, initialData, onClose, onSuccess }) {
  const overlayRef = useRef(null);
  const [serverError, setServerError] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "",
      password: "",
    },
    validate: (values) => {
      const result = userSchema.safeParse(values);
      const errors = {};
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message;
        });
      }
      if (mode === "add" && (!values.password || values.password.length < 6)) {
        errors.password = "Password must be at least 6 characters";
      }
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        let res;
        if (mode === "add") {
          res = await createUser(values.name, values.email, values.password, values.role);
        } else {
          // Edit mode
          res = await updateUser(initialData.id, values.name, values.email, values.role);
        }

        if (!res.ok) {
          throw new Error(res.message || "Something went wrong");
        }
        
        onSuccess(res.data);
      } catch (err) {
        setServerError(err.message || "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,15,46,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 20px", overflowY: "auto",
      }}
    >
      <div className="animate-fadeUp card" style={{
        background: "var(--bg-card)", borderRadius: "24px",
        width: "100%", maxWidth: "520px",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
        marginTop: "auto", marginBottom: "auto",
        backgroundColor: "white" // Ensure standard white background for dashboards that might not set vars globally
      }}>
        <div style={{ padding: "24px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: "700" }}>
              {mode === "edit" ? "Edit User" : "Add User"}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
              {mode === "edit" ? "Update user details and roles" : "Create a new user account"}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon p-1 hover:bg-gray-100 rounded-md transition-colors" style={{ flexShrink: 0, marginLeft: "12px" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label className="label block text-sm font-semibold mb-1">Name *</label>
              <input
                className="input w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                name="name"
                placeholder="Full Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formik.errors.name}</div>
              )}
            </div>

            <div>
              <label className="label block text-sm font-semibold mb-1">Email Address *</label>
              <input
                className="input w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                name="email"
                type="email"
                placeholder="name@company.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formik.errors.email}</div>
              )}
            </div>

            <div>
              <label className="label block text-sm font-semibold mb-1">Role *</label>
              <select
                className="input w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                name="role"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.role}
              >
                <option value="">Select a role...</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="mentor">Mentor</option>
                <option value="intern">Intern</option>
              </select>
              {formik.touched.role && formik.errors.role && (
                <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formik.errors.role}</div>
              )}
            </div>

            {mode === "add" && (
              <div>
                <label className="label block text-sm font-semibold mb-1">Temporary Password *</label>
                <input
                  className="input w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/30"
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                />
                {formik.touched.password && formik.errors.password && (
                  <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formik.errors.password}</div>
                )}
              </div>
            )}
          </div>

          {serverError && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: "10px", padding: "10px 14px", color: "#f87171", fontSize: "13px" }}>
              {serverError}
            </div>
          )}

          <div style={{ paddingTop: "10px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="bg-[#1a3aff] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#1a3aff]/30 hover:bg-[#1a3aff]/90 transition-all duration-200"
              style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}
            >
              {formik.isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
