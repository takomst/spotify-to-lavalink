import { LavalinkNode } from "lavacord";
import fetch from "node-fetch";

const BASE_URL = "https://api.spotify.com/v1";

export default class SpotifyParser {
	public nodes: LavalinkNode;
	public id: string;
	private secret: string;
	private authorization: string;
	private token: string | null;
	private options: { headers: { "Content-Type": string; Authorization: string | null; }; };

	/**
	 * A class to convert Spotify URLs into Lavalink track objects.
	 * @param LavalinkNode A lavalink node to expose the lavalink API
	 * @param clientID Your Spotify's client ID.
	 * @param clientSecret Your Spotify's client secret.
	 */
	constructor(LavalinkNode: LavalinkNode, clientID: string, clientSecret: string) {
		this.nodes = LavalinkNode;
		this.id = clientID;
		this.secret = clientSecret;
		this.authorization = Buffer.from(`${clientID}:${clientSecret}`).toString("base64");
		this.token = null;
		this.options = {
			headers: {
				"Content-Type": "application/json",
				"Authorization": this.token
			}
		};

		this.renewToken();
	}

	/**
	 * Fetch the tracks from the album and return its artists and track name.
	 * @param id The album ID.
	 */
	public async getAlbum(id: string): Promise<string[]> {
		const { items }: Album = (await (await fetch(`${BASE_URL}/albums/${id}/tracks`, this.options)).json());
		return items.map(song => `${song.artists.map(artist => artist.name).join(", ")} - ${song.name}`);
	}

	/**
	 * Fetch the tracks from the playlist and return its artists and track name.
	 * @param id The playlist ID.
	 */
	public async getPlaylistTracks(id: string): Promise<string[]> {
		const { items }: PlaylistItems = (await (await fetch(`${BASE_URL}/playlists/${id}/tracks`, this.options)).json());
		return items.map(item => `${item.track.artists.map(artist => artist.name).join(", ")} - ${item.track.name}`);
	}

	/**
	 * Fetch the track and return its artist and title
	 * @param id The song ID.
	 */
	public async getTrack(id: string): Promise<string> {
		const track: Track = (await (await fetch(`${BASE_URL}/tracks/${id}`, this.options)).json());
		const artists: string[] = track.artists.map(artist => artist.name);
		return `${artists.join(", ")} - ${track.name}`;
	}

	private renewToken() {
		setInterval(async () => {
			const { access_token }= await (await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				body: "grant_type=client_credentials",
				headers: {
					Authorization: `Basic ${this.authorization}`,
					"Content-Type": "application/x-www-form-urlencoded"
				}
			})).json();

			this.token = access_token;
		}, 1000 * 60 * 55);
	}

}

interface Album {
	items: [Track]
}
interface PlaylistItems {
	items: [{
		track: Track
	}]
}

interface Track {
	artists: Artist[],
	name: string;
}

interface Artist {
	name: string;
}
