import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/RequireRole";
import { gqlFetch } from "@/lib/graphql-client";

const GET_DEPARTMENT_BY_HEAD = `
  query GetDepartmentByHead($head_user_id: uuid!) {
    departments(where: { head_user_id: { _eq: $head_user_id } }, limit: 1) {
      id
      name
    }
  }
`;

const GET_DEPARTMENT_BY_MENTOR = `
  query GetDepartmentByMentor($mentor_id: uuid!) {
    interns(
      where: { mentor_id: { _eq: $mentor_id }, department_id: { _is_null: false } }
      distinct_on: department_id
    ) {
      department {
        id
        name
      }
    }
  }
`;

function buildScopedQuestion(question, department) {
  return [
    "You must only query records for this department.",
    `Department ID: ${department.id}.`,
    "Always include a WHERE clause that filters interns.department_id to that exact UUID.",
    `Question: ${question}`,
  ].join(" ");
}

function isUnsafeSql(sql) {
  const text = sql.toLowerCase();
  const forbidden = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "truncate",
    "create",
  ];
  return forbidden.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(text),
  );
}

function hasDepartmentFilter(sql, departmentId) {
  const normalized = sql.toLowerCase();
  return normalized.includes(departmentId.toLowerCase());
}
function filterSensitiveColumns(results, columns) {
  const sensitiveColumns = new Set([
    "password",
    "password_hash",
    "api_key",
    "secret",
    "token",
    "access_token",
    "refresh_token",
  ]);

  const filteredColumns = columns.filter(
    (col) => !sensitiveColumns.has(col.toLowerCase()),
  );

  const filteredResults = results.map((row) => {
    const newRow = {};
    filteredColumns.forEach((col) => {
      if (col in row) {
        newRow[col] = row[col];
      }
    });
    return newRow;
  });

  return { columns: filteredColumns, results: filteredResults };
}
export async function POST(req) {
  const session = await requireAuth(req, ["admin", "mentor", "hr"]);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 },
    );
  }

  const vannaBase = process.env.VANNA_API_BASE;
  if (!vannaBase) {
    return NextResponse.json(
      { error: "VANNA_API_BASE is not configured" },
      { status: 500 },
    );
  }

  let scopedQuestion = question;
  let department = null;

  if (session.user.role !== "admin") {
    const headData = await gqlFetch(GET_DEPARTMENT_BY_HEAD, {
      head_user_id: session.user.id,
    });
    department = headData?.departments?.[0];

    if (!department) {
      const mentorData = await gqlFetch(GET_DEPARTMENT_BY_MENTOR, {
        mentor_id: session.user.id,
      });
      const departments = (mentorData?.interns || [])
        .map((row) => row.department)
        .filter(Boolean);

      if (departments.length === 1) {
        department = departments[0];
      } else if (departments.length > 1) {
        return NextResponse.json(
          { error: "Multiple departments detected for mentor" },
          { status: 403 },
        );
      }
    }
    if (!department) {
      return NextResponse.json(
        { error: "Department scope missing" },
        { status: 403 },
      );
    }
    scopedQuestion = buildScopedQuestion(question, department);
  }

  try {
    const vannaResponse = await fetch(`${vannaBase}/api/v0/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: scopedQuestion }),
      cache: "no-store",
    });

    if (!vannaResponse.ok) {
      const errorText = await vannaResponse.text();
      return NextResponse.json(
        { error: errorText || "Vanna error" },
        { status: 502 },
      );
    }

    const payload = await vannaResponse.json();
    const sql = payload?.sql || "";

    if (
      !sql ||
      !sql.trim().toLowerCase().startsWith("select") ||
      isUnsafeSql(sql)
    ) {
      return NextResponse.json(
        { error: "Unsafe SQL generated" },
        { status: 400 },
      );
    }

    if (department && !hasDepartmentFilter(sql, department.id)) {
      return NextResponse.json(
        { error: "Department scope not enforced in SQL" },
        { status: 403 },
      );
    }

    // Filter sensitive columns before returning to frontend
    const { columns: filteredColumns, results: filteredResults } =
      filterSensitiveColumns(payload?.results ?? [], payload?.columns ?? []);

    return NextResponse.json({
      question,
      sql,
      columns: filteredColumns,
      results: filteredResults,
      department: department
        ? { id: department.id, name: department.name }
        : null,
    });
  } catch (error) {
    console.error("[chatbot ask]", error.message);
    return NextResponse.json(
      { error: "Chatbot request failed" },
      { status: 500 },
    );
  }
}
