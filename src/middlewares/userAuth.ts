// @deno-types="@types/express"
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/JWTComponent.ts';
import { handleError } from '../utils/errorHandler.ts';
import userService from '../services/user.service.ts';

export async function userAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.header('Authorization')?.split(' ')[1] || req.body.token;
		if (!token) {
			res.status(401).json({ message: 'No token provided' });
			return;
		}

		const payload = await verifyToken(token);
		if (!payload) {
			res.status(401).json({ message: 'Invalid token' });
			return;
		}
		try {
			const user = await userService.specialGetUserById(payload.id as string);
			console.log(user);
			if (!user) {
				res.status(401).json({ message: 'Invalid token' });
			}
			req.user = payload.id as string;
			next();
		} catch (_error) {
			res.status(401).json({ message: 'Invalid token' });
			return;
		}
	} catch (error) {
		handleError(error, res);
		return;
	}
}
