import { gqlFetch } from "@/lib/graphql-client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"


const GET_USER_QUERY = `
  query GetUser($id: uuid!) {
    users(where: {id: {_eq: $id}}) {
    password_hash
  }
  }
`;

const UPDATE_USER_PASSWORD_MUTATION = `
  mutation UpdateUserPassword($id: uuid!, $password_hash: String!) {
    update_users_by_pk(pk_columns: {id: $id}, _set: {password_hash: $password_hash}) {
    password_hash
  }
  }
`;

export const POST = async (req) => {
    try {
        const { id, currentPassword, newPassword, confirmPassword } = await req.json()
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { ok: false, message: "All fields are required" },
                { status: 400 }
            );
        }
        const user = await gqlFetch(GET_USER_QUERY, { id })
        if (!user.users[0]) {
            return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 })
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.users[0].password_hash)
        if (!isPasswordValid) {
            return NextResponse.json({ ok: false, message: "Invalid current password" }, { status: 401 })
        }
        
        if (newPassword !== confirmPassword) {
            return NextResponse.json({ ok: false, message: "New password and confirm password do not match" }, { status: 400 })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatedUser = await gqlFetch(UPDATE_USER_PASSWORD_MUTATION, { id, password_hash: hashedPassword })
        return NextResponse.json({ ok: true, message: "Password changed successfully", data: updatedUser }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 })
    }
}

