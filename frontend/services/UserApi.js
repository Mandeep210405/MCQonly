import toast from "react-hot-toast"

export const createUser = async (name, email, password, role) => {
    const response = await fetch(`/api/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
    })
    const res = await response.json()
    if (res.ok) {
        toast.success(res.message || "User created successfully")
    } else {
        toast.error(res.message || "Failed to create user")
    }
    return res
}

export const updateUser = async (id, name, email, role) => {
    const response = await fetch(`/api/users/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name, email, role }),
    })
    const res = await response.json()
    if (res.ok) {
        toast.success(res.message || "User updated successfully")
    } else {
        toast.error(res.message || "Failed to update user")
    }
    return res
}

export const deleteUser = async (id) => {
    const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    })
    const res = await response.json()
    if (res.ok) {
        toast.success(res.message || "User deleted successfully")
    } else {
        toast.error(res.message || "Failed to delete user")
    }
    return res
}

export const changePassword = async (id, currentPassword, newPassword, confirmPassword) => {
    const response = await fetch(`/api/users/${id}/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, currentPassword, newPassword, confirmPassword }),
    })

    const res = await response.json();

    if(!res.ok){
        toast.error(res.message)
    }
    else{
        toast.success(res.message)
    }


    return res
}
