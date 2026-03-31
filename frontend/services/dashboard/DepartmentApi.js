export const getAllDepartments = async () => {
    try {
        const res = await fetch('/api/departments')
        const data = await res.json()
        
        return data.data.departments
    } catch (error) {
        console.error('Department error:', error.message)
            return { error: error.message, ok: false }
    }
}

export const getManagerDepartment = async (id) => {
    try {
        const res = await fetch(`/api/departments/${id}`);
        const data = await res.json();
        
        return data;
    } catch (error) {
        console.error('Manager Department error:', error.message);
        return { error: error.message, success: false };
    }
};