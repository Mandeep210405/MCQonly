export const getInterns = async () => {
    const response = await fetch('/api/interns');
    return response.json();
}
