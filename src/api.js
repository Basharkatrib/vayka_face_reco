const API_URL = import.meta.env.VITE_API_URL + '/api';

const api = {
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed. Please check your credentials.');
        return data.data;
    },

    async getOwnerHotels(token) {
        const response = await fetch(`${API_URL}/owner/hotels`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch properties');
        return data.data.hotels;
    },

    async verifyFace(hotelId, descriptor, token) {
        const response = await fetch(`${API_URL}/face/verify`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ hotel_id: hotelId, descriptor })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.errors?.[0] || 'No match found in current bookings');
        return data.data;
    },

    async getHotelBookings(hotelId, token) {
        const response = await fetch(`${API_URL}/owner/hotels/${hotelId}/bookings`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return data.data.bookings;
    },

    async registerFace(bookingId, descriptor, token) {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/register-face`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ descriptor })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Face registration failed');
        return data;
    }
};

export default api;
