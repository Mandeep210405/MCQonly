export const getTasks = async () => {
    const response = await fetch('/api/tasks');
    return response.json();
}

export const createTask = async (taskData) => {
    const response = await fetch('/api/tasks', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
    });
    return response.json();
}

export const updateTask = async (id, taskData) => {
    const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
    });
    return response.json();
}

export const deleteTask = async (id) => {
    const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });
    return response.json();
}
