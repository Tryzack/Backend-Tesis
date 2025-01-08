import { serve } from 'https://deno.land/std@0.150.0/http/server.ts';

export default function startLoadBalancer(
	port: number,
	workersPort: number,
	workerNumbers: number,
) {
	const workers: number[] = [];
	let currentWorker = 0;
	for (let i = 0; i < workerNumbers; i++) {
		workers.push(workersPort + i);
	}

	serve(
		async (req) => {
			const targetPort = workers[currentWorker];
			currentWorker = (currentWorker + 1) % workers.length;

			const url = new URL(req.url);
			url.hostname = '0.0.0.0';
			url.port = targetPort.toString();

			try {
				const response = await fetch(url.toString(), {
					method: req.method,
					headers: req.headers,
					body: req.body,
				});

				const hasBody = !(response.status === 204 || response.status === 304);
				const body = hasBody ? await response.text() : null;

				return new Response(body, {
					status: response.status,
					headers: response.headers,
				});
			} catch (error) {
				console.error('Error while forwarding request:', error);
				return new Response('Internal Server Error', { status: 500 });
			}
		},
		{
			port: port,
			onListen: () => {
				console.log(`Balancer running on port ${port}`);
			},
		},
	);
}
