"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodToFormikValidate } from "@/utils/zodToFormik";
import { loginSchema } from "@/lib/validations/auth";
import { useFormik } from "formik";

function page() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { handleSubmit, handleChange, values, errors, touched, handleBlur } =
    useFormik({
      initialValues: {
        email: "",
        password: "",
      },

      validate: zodToFormikValidate(loginSchema),

      onSubmit: async (values) => {
        setLoading(true);

        const res = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (res?.error) {
          setError("Invalid email or password. Please try again.");
        } else {
          router.refresh();
          router.push("/dashboard");
        }

        setLoading(false);
      },
    });

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="w-1/4 h-fit flex flex-col gap-5 px-8 py-16 justify-center text-center bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-7 text-gray-400">
          Welcome Back! <br />
          <span className="text-[#6366f1] text-4xl">InternOS</span>
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-2 py-2"
        >
          {/* EMAIL */}
          <div className="w-full flex flex-col mb-6">
            <input
            name="email"  
            className="bg-[#f0f4ff] p-2 rounded-lg border border-gray-300"
            type="text"
            placeholder="xyz@company.com"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.email}
          />
          {errors.email && touched.email && (
            <p className="text-red-500">{errors.email}</p>
          )}
          </div>

          {/* PASSWORD */}
          <div className="w-full flex flex-col mb-6">
          <input
            name="password" 
            className="bg-[#f0f4ff] p-2 rounded-lg border border-gray-300"
            type="password"
            placeholder="Enter Password"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.password}
          />
          {errors.password && touched.password && (
            <p className="text-red-500">{errors.password}</p>
          )}
          </div>

          {/* ERROR MESSAGE */}
          {error && <p className="text-red-500">{error}</p>}

          <button
            className="bg-[#6366f1] text-white font-semibold cursor-pointer py-2 rounded-lg mt-5"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-400 mt-3">
          Go Back to{" "}
          <Link className="text-[#6366f1]" href="/">
            Home Page
          </Link>
        </p>
      </div>
    </div>
  );
}

export default page;