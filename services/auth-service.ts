import axios from 'axios'

const login = async (email: string, password: string) => {
	const response = await axios.post('/users/loginUser', { email, password })
	return response.data
}

const register = async (name: string, email: string) => {
	const response = await axios.post('/users', { name, email })
	return response.data
}

const authService = { login, register }
export default authService
