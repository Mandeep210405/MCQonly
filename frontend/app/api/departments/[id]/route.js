// import { gqlFetch } from "@/lib/graphql-client";
// import { requireAuth } from "@/lib/middleware/RequireRole";
// import { NextResponse } from "next/server";

// const DEPARTMENT_MANAGER_QUERY = `
//   query MyQuery($id: uuid!) {
//     departments(where: {head_user_id: {_eq: $id}}) {
//       name
//       description
//       interns {
//         college
//         user {
//           name
//           email
//           id
//         }
//       }
//     }
//   }
// `;

// export async function GET(request, context) {

//   const session = await requireAuth(request, ["admin", "manager", "mentor"])
//   if (!session) {
//     return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })
//   }

//   const params = await context.params;
//   const id = params.id;

//   try {
//     const data = await gqlFetch(DEPARTMENT_MANAGER_QUERY, { id });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Manager department details fetched successfully",
//         data: data
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('Department fetch error:', error.message);
//     return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
//   }
// }

import { gqlFetch } from "@/lib/graphql-client";
import { requireAuth } from "@/lib/middleware/RequireRole";
import { NextResponse } from "next/server";

const DEPARTMENT_MANAGER_QUERY = `
  query MyQuery($id: uuid!) {
    departments(where: {head_user_id: {_eq: $id}}) {
      name
      description
      interns {
        id
        college
        user {
          name
          email
          id
        }
      }
    }
  }
`;

export async function GET(request, context) {

  const session = await requireAuth(request, ["admin", "manager", "mentor"])
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", ok: false }, { status: 401 })
  }

  const params = await context.params;
  const id = params.id;

  try {
    const data = await gqlFetch(DEPARTMENT_MANAGER_QUERY, { id });

    return NextResponse.json(
      {
        success: true,
        message: "Manager department details fetched successfully",
        data: data
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Department fetch error:', error.message);
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
  }
}