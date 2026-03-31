import { getServerSession } from "next-auth";
import { authOptions } from "../auth";


export async function requireAuth(req, roles = []) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return null;
    }

    if (roles.length && !roles.includes(session.user.role)) {
        return null;
    }

    return session;
}