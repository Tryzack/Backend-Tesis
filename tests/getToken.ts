export default async function getToken(data?: { username: string; password: string }) {
	const moduleURL = Deno.env.get('AUTH_URL') || 'http://0.0.0.0:4000/auth';
	const requestBody = data || { username: 'admin', password: 'Admin123' };
	const response = await fetch(`${moduleURL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});
	const {
		data: { token },
	} = await response.json();
	return token;
}
