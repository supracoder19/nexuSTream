import axios from "axios";
const gateway_api = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8081/apiV2/"
const core_api = import.meta.env.VITE_CORE_URL || "http://localhost:8081/apiV1/"
const fetchAllNotification = async (pageNo, pageSize) => {
    try {
        // 1. Fetch data from your Spring Boot Endpoint
        const res = await axios.post(`${core_api}notifications/all`, {
            pageNo, pageSize
        }, {
            withCredentials: true
        });
        if (res.data.success) {
            return res.data.data[0]
        }
        else throw new Error(res.data.msg)
    } catch (error) {
        console.error(error)
    }
    return null
};
const fetchUnreadNotification = async () => {
    try {
        // 1. Fetch data from your Spring Boot Endpoint
        const res = await axios.get(`${core_api}notifications/unread`, {
            withCredentials: true
        });
        if (res.data.success) {
            return res.data.data[0]
        }
        else throw new Error(res.data.msg)
    } catch (error) {
        console.error(error)
    }
    return null
};

const markRead = (notifications = []) => {
    // 1. Fetch data from your Spring Boot Endpoint
    notifications.forEach(async (n) => {
        const res = await axios.post(`${core_api}notifications/markRead/${n.id}`, {
            withCredentials: true
        });
    })
};
export { fetchAllNotification, fetchUnreadNotification, markRead }
