import { extname, fromFileUrl } from 'https://deno.land/std@0.224.0/path/mod.ts';
import MIME_TYPES from '../types/types.ts';

const STATIC_DIR = '../../public';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const handler = async (request: Request): Promise<Response> => {
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	const url = new URL(request.url);
	const filePath = fromFileUrl(new URL(STATIC_DIR + url.pathname, import.meta.url));

	try {
		const fileInfo = await Deno.stat(filePath);
		if (fileInfo.isFile) {
			const file = await Deno.readFile(filePath);
			const contentType = MIME_TYPES[extname(filePath)];
			if (!contentType) {
				console.log('404: Not Found');
				return new Response('404: Not Found', {
					status: 404,
					headers: corsHeaders,
				});
			}
			return new Response(file, {
				headers: {
					'Content-Type': contentType,
					...corsHeaders,
				},
			});
		}
		console.log('404: Not Found');
		return new Response('404: Not Found', {
			status: 404,
			headers: corsHeaders,
		});
	} catch (error) {
		console.log(error);
		return new Response('404: Not Found', {
			status: 404,
			headers: corsHeaders,
		});
	}
};

Deno.serve(
	{
		port: Number(Deno.env.get('STATIC_SERVER_PORT')),
		onListen() {
			console.log(
				`Static file server running on http://0.0.0.0:${Deno.env.get('STATIC_SERVER_PORT')}/`
			);
		},
	},
	handler
);
