export const getInternDataById = async (id) => {
    try {
        const res = await fetch(`/api/interns/my-profile`)
        const data = await res.json()
        return data
    } catch (error) {
        console.log(error)
    }
}