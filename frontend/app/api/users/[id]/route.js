import { gqlFetch } from "@/lib/graphql-client"
import { requireAuth } from "@/lib/middleware/RequireRole"
import { NextResponse } from "next/server"

const UPDATE_USER = `
mutation UpdateUser($id : uuid!, $name : String!, $email : String!, $role : String!) {
update_users_by_pk(
    pk_columns: { id: $id }
    _set: { name: $name, email: $email, role: $role }
  ) {
    id
    name
    role
  }
}
`

const DELETE_USER = `
mutation DeleteUser($id : uuid!) {
delete_users_by_pk(id: $id) {
    id
  }
}
`

export const POST = async (req, res) => {
  try {
    const session = await requireAuth(req, ["admin"])
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }
    const { id, name, email, role } = await req.json()
    const updatedUser = await gqlFetch(UPDATE_USER, { id, name, email, role })
    return NextResponse.json({ ok: true, data: updatedUser?.update_users_by_pk, message: "User updated successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, message: error.message || "Something went wrong" }, { status: 500 });
  }
}

export const DELETE = async (req, res) => {
  try {
    const session = await requireAuth(req, ["admin"])
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }
    const { id } = await req.json()
    const deletedUser = await gqlFetch(DELETE_USER, { id })
    return NextResponse.json({ ok: true, data: deletedUser?.delete_users_by_pk, message: "User deleted successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, message: error.message || "Something went wrong" }, { status: 500 });
  }
}