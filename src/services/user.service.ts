import { sql } from 'kysely';
import db from '../app/db.ts';
import { NotFoundError } from '../utils/errors/httpErrors.ts';

class UserService {
	async getAllUsers() {
		return await db
			.selectFrom('users')
			.leftJoin('user_followers', 'users.id', 'user_followers.user_id')
			.leftJoin('posts', 'users.id', 'posts.user_id')
			.select([
				'users.id',
				'users.fname',
				'users.lname',
				'users.username',
				'users.biography',
				'users.address',
				'users.image',
				'users.birth_date',
				'users.deleted_at',
				db.fn.count('posts.id').as('posts_nu'),
				db.fn.count('user_followers.user_follower').as('followers_nu'),
			])
			.groupBy('users.id') // Ensure grouping by user id to count followers
			.execute();
	}

	async specialGetUserById(id: string) {
		const user = await db
			.selectFrom('users')
			.leftJoin(
				db
					.selectFrom('user_emissions')
					.select([
						'user_id',
						'id as emissions_id',
						'impact',
						'direct_emissions',
						'indirect_emissions',
						'other_emissions',
						'created_at',
						'updated_at',
					])
					.as('emissions'),
				'emissions.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_id',
						sql<number>`COUNT(user_follower)`.as('followers_nu'),
					])
					.groupBy('user_id')
					.as('follower_counts'),
				'follower_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_follower',
						sql<number>`COUNT(user_id)`.as('following_nu'),
					])
					.groupBy('user_follower')
					.as('following_counts'),
				'following_counts.user_follower',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('activities')
					.where('completed', '=', true) // Filter only completed activities
					.select([
						'user_id',
						sql<number>`COUNT(*)`.as('activities_nu'),
					])
					.groupBy('user_id')
					.as('activity_counts'),
				'activity_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select(['user_id', sql<boolean>`TRUE`.as('is_following')])
					.as('user_follows'),
				'user_follows.user_id',
				'users.id',
			)
			.where('users.id', '=', id)
			.select([
				'users.id',
				'users.fname',
				'users.lname',
				'users.username',
				'users.biography',
				'users.address',
				'users.image',
				'users.birth_date',
				'emissions.emissions_id',
				'emissions.impact',
				'emissions.direct_emissions',
				'emissions.indirect_emissions',
				'emissions.other_emissions',
				'emissions.created_at',
				'emissions.updated_at',
				sql<number>`COALESCE(follower_counts.followers_nu, 0)`.as('followers_nu'),
				sql<number>`COALESCE(following_counts.following_nu, 0)`.as('following_nu'),
				sql<number>`COALESCE(activity_counts.activities_nu, 0)`.as('activities_nu'),
			])
			.executeTakeFirst();

		if (!user) {
			throw new NotFoundError('User not found');
		}
		const posts = await this.getUserPosts(id, 1); // Get first 10 posts
		return { user, posts };
	}
	async getUserById(id: string, requesterId: string) {
		const user = await db
			.selectFrom('users')
			.leftJoin(
				db
					.selectFrom('user_emissions')
					.select([
						'user_id',
						'id as emissions_id',
						'impact',
						'direct_emissions',
						'indirect_emissions',
						'other_emissions',
						'created_at',
						'updated_at',
					])
					.as('emissions'),
				'emissions.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_id',
						sql<number>`COUNT(user_follower)`.as('followers_nu'),
					])
					.groupBy('user_id')
					.as('follower_counts'),
				'follower_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_follower',
						sql<number>`COUNT(user_id)`.as('following_nu'),
					])
					.groupBy('user_follower')
					.as('following_counts'),
				'following_counts.user_follower',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('activities')
					.where('completed', '=', true) // Filter only completed activities
					.select([
						'user_id',
						sql<number>`COUNT(*)`.as('activities_nu'),
					])
					.groupBy('user_id')
					.as('activity_counts'),
				'activity_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.where('user_follower', '=', requesterId) // Check if the requester is following
					.select(['user_id', sql<boolean>`TRUE`.as('is_following')])
					.as('user_follows'),
				'user_follows.user_id',
				'users.id',
			)
			.where('users.id', '=', id)
			.select([
				'users.id',
				'users.fname',
				'users.lname',
				'users.username',
				'users.biography',
				'users.address',
				'users.image',
				'users.birth_date',
				'emissions.emissions_id',
				'emissions.impact',
				'emissions.direct_emissions',
				'emissions.indirect_emissions',
				'emissions.other_emissions',
				'emissions.created_at',
				'emissions.updated_at',
				sql<number>`COALESCE(follower_counts.followers_nu, 0)`.as('followers_nu'),
				sql<number>`COALESCE(following_counts.following_nu, 0)`.as('following_nu'),
				sql<number>`COALESCE(activity_counts.activities_nu, 0)`.as('activities_nu'),
				sql<boolean>`COALESCE(user_follows.is_following, FALSE)`.as('is_following'),
			])
			.executeTakeFirst();

		if (!user) {
			throw new NotFoundError('User not found');
		}
		const posts = await this.getUserPosts(id, 1); // Get first 10 posts
		return { user, posts };
	}

	async getUserByUsername(username: string, requesterId: string) {
		const user = await db
			.selectFrom('users')
			.leftJoin(
				db
					.selectFrom('user_emissions')
					.select([
						'user_id',
						'id as emissions_id',
						'impact',
						'direct_emissions',
						'indirect_emissions',
						'other_emissions',
						'created_at',
						'updated_at',
					])
					.as('emissions'),
				'emissions.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_id',
						sql<number>`COUNT(user_follower)`.as('followers_nu'),
					])
					.groupBy('user_id')
					.as('follower_counts'),
				'follower_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_follower',
						sql<number>`COUNT(user_id)`.as('following_nu'),
					])
					.groupBy('user_follower')
					.as('following_counts'),
				'following_counts.user_follower',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('activities')
					.where('completed', '=', true) // Filter only completed activities
					.select([
						'user_id',
						sql<number>`COUNT(*)`.as('activities_nu'),
					])
					.groupBy('user_id')
					.as('activity_counts'),
				'activity_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.where('user_follower', '=', requesterId) // Check if the requester is following
					.select(['user_id', sql<boolean>`TRUE`.as('is_following')])
					.as('user_follows'),
				'user_follows.user_id',
				'users.id',
			)
			.where('users.username', '=', username)
			.select([
				'users.id',
				'users.fname',
				'users.lname',
				'users.username',
				'users.biography',
				'users.address',
				'users.image',
				'users.birth_date',
				'emissions.emissions_id',
				'emissions.impact',
				'emissions.direct_emissions',
				'emissions.indirect_emissions',
				'emissions.other_emissions',
				'emissions.created_at',
				'emissions.updated_at',
				sql<number>`COALESCE(follower_counts.followers_nu, 0)`.as('followers_nu'),
				sql<number>`COALESCE(following_counts.following_nu, 0)`.as('following_nu'),
				sql<number>`COALESCE(activity_counts.activities_nu, 0)`.as('activities_nu'),
				sql<boolean>`COALESCE(user_follows.is_following, FALSE)`.as('is_following'),
			])
			.executeTakeFirst();

		if (!user) {
			throw new NotFoundError('User not found');
		}
		const posts = await this.getUserPosts(user.id, 1); // Get first 10 posts
		return { user, posts };
	}

	async getUserByEmail(email: string) {
		const user = await db
			.selectFrom('users')
			.leftJoin(
				db
					.selectFrom('user_emissions')
					.select([
						'user_id',
						'id as emissions_id',
						'impact',
						'direct_emissions',
						'indirect_emissions',
						'other_emissions',
						'created_at',
						'updated_at',
					])
					.as('emissions'),
				'emissions.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_id',
						sql<number>`COUNT(user_follower)`.as('followers_nu'),
					])
					.groupBy('user_id')
					.as('follower_counts'),
				'follower_counts.user_id',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('user_followers')
					.select([
						'user_follower',
						sql<number>`COUNT(user_id)`.as('following_nu'),
					])
					.groupBy('user_follower')
					.as('following_counts'),
				'following_counts.user_follower',
				'users.id',
			)
			.leftJoin(
				db
					.selectFrom('activities')
					.select([
						'user_id',
						sql<number>`COUNT(completed)`.as('activities_nu'),
					])
					.groupBy('user_id')
					.as('activity_counts'),
				'activity_counts.user_id',
				'users.id',
			)
			.where('users.email', '=', email)
			.select([
				'users.id',
				'users.fname',
				'users.lname',
				'users.username',
				'users.biography',
				'users.address',
				'users.image',
				'users.birth_date',
				'emissions.emissions_id',
				'emissions.impact',
				'emissions.direct_emissions',
				'emissions.indirect_emissions',
				'emissions.other_emissions',
				'emissions.created_at',
				'emissions.updated_at',
				sql<number>`COALESCE(follower_counts.followers_nu, 0)`.as('followers_nu'),
				sql<number>`COALESCE(following_counts.following_nu, 0)`.as('following_nu'),
				sql<number>`COALESCE(activity_counts.activities_nu, 0)`.as('activities_nu'),
			])
			.executeTakeFirst();

		if (user) {
			const posts = await this.getUserPosts(user.id, 1); // Get first 10 posts
			return { user, posts };
		}

		return { user: null, posts: [] };
	}

	async updateUser(
		id: string,
		data: Partial<{
			username: string;
			image?: string;
			fname: string;
			lname: string;
			biography?: string;
			email: string;
			password: string;
			address?: string;
			birth_date?: Date;
		}>,
	) {
		return await db.updateTable('users').set(data).where('id', '=', id).where(
			'deleted_at',
			'is',
			null,
		).returning([
			'id',
			'fname',
			'lname',
			'username',
			'email',
			'biography',
			'address',
			'birth_date',
			'image',
		]).execute();
	}

	async updateUserEmissions(
		id: string,
		data: Partial<{
			impact: number;
			direct_emissions: number;
			indirect_emissions: number;
			other_emissions: number;
		}>,
	) {
		return await db.updateTable('user_emissions').set(data).where('user_id', '=', id).execute();
	}

	async deleteUser(id: string) {
		console.log(id);
		return await db.updateTable('users').set({ deleted_at: new Date() })
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.returning([
				'id',
				'fname',
				'lname',
				'username',
				'email',
				'biography',
				'address',
				'birth_date',
				'image',
			])
			.executeTakeFirstOrThrow();
	}

	async getUserPosts(userId: string, page = 1) {
		const limit = 10;
		const offset = (page - 1) * limit;

		const posts = await db
			.selectFrom('posts')
			.leftJoin('users', 'posts.user_id', 'users.id')
			.leftJoin(
				db
					.selectFrom('post_replies')
					.select(['post_id', sql<number>`COUNT(id)`.as('reply_count')])
					.groupBy('post_id')
					.as('reply_counts'),
				'reply_counts.post_id',
				'posts.id',
			)
			.leftJoin(
				db
					.selectFrom('post_images')
					.select(['post_id', sql<string[]>`ARRAY_AGG(DISTINCT image)`.as('images')])
					.groupBy('post_id')
					.as('image_agg'),
				'image_agg.post_id',
				'posts.id',
			)
			.leftJoin(
				db
					.selectFrom('post_videos')
					.select(['post_id', sql<string[]>`ARRAY_AGG(DISTINCT video)`.as('videos')])
					.groupBy('post_id')
					.as('video_agg'),
				'video_agg.post_id',
				'posts.id',
			)
			.leftJoin(
				db
					.selectFrom('post_likes')
					.where('user_id', '=', userId)
					.select(['post_id', sql<boolean>`TRUE`.as('user_liked')])
					.as('user_likes'),
				'user_likes.post_id',
				'posts.id',
			)
			.leftJoin('coordinates', 'posts.coordinates_id', 'coordinates.id')
			.where('posts.user_id', '=', userId)
			.select([
				'posts.id as postId',
				'posts.caption',
				'posts.content',
				'posts.post_date',
				'posts.likes',
				'users.id as userId',
				'users.username',
				'coordinates.x as coord_x',
				'coordinates.y as coord_y',
				sql<number>`COALESCE(reply_counts.reply_count, 0)`.as('replies_nu'),
				sql<string[]>`COALESCE(image_agg.images, ARRAY[]::VARCHAR[])`.as('images'),
				sql<string[]>`COALESCE(video_agg.videos, ARRAY[]::VARCHAR[])`.as('videos'),
				sql<boolean>`COALESCE(user_likes.user_liked, FALSE)`.as('user_liked'),
			])
			.groupBy([
				'posts.id',
				'users.id',
				'coordinates.x',
				'coordinates.y',
				'reply_counts.reply_count',
				'image_agg.images',
				'video_agg.videos',
				'user_likes.user_liked',
			]) // Include aggregated subqueries in GROUP BY
			.orderBy('posts.post_date', 'desc') // Sort by most recent
			.limit(limit)
			.offset(offset)
			.execute();

		return posts.map((post) => ({
			id: post.postId,
			user_id: post.userId,
			username: post.username,
			caption: post.caption,
			post_date: post.post_date,
			likes: post.likes,
			x: post.coord_x,
			y: post.coord_y,
			images: post.images || [],
			videos: post.videos || [],
			user_liked: post.user_liked,
			replies_nu: post.replies_nu,
		}));
	}
}

export default new UserService();
