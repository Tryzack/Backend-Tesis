import { Server } from 'socket.io';
import index from '../sockets/index.ts';

// deno-lint-ignore no-explicit-any
const socketSetup = (options?: any) => {
	const io = new Server(options);

	io.on('connection', (socket) => {
		console.log('New connection', socket.id);

		index(io, socket);

		socket.on('disconnect', () => {
			console.log('Disconnected', socket.id);
		});
	});

	return io;
};

export default socketSetup;