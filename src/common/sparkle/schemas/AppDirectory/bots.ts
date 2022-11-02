/* eslint-disable no-tabs */
export interface Bot {
	id: string;
	username: string;
	avatar?: string | null;
	avatar_decoration?: any;
	discriminator: string;
	public_flags: number;
	bot: boolean;
}

export interface Install_param {
	scopes: string[];
	permissions: string;
}

export interface Guild {
	id: string;
	name: string;
	icon: string;
	description?: any;
	splash: string;
	discovery_splash: string;
	features: string[];
	approximate_member_count: number;
	approximate_presence_count: number;
}

export interface Category {
	id: number;
	name: string;
}

export interface Carousel_item {
	type: number;
	url: string;
	proxy_url: string;
}

export interface External_url {
	name: string;
	url: string;
}

export interface Option {
	type: number;
	name: string;
	description: string;
}

export interface Popular_application_command {
	id: string;
	application_id: string;
	version: string;
	default_permission: boolean;
	default_member_permissions?: any;
	type: number;
	name: string;
	description: string;
	dm_permission: boolean;
	options: Option[];
}

export interface Directory_entry {
	guild_count: number;
	detailed_description: string;
	carousel_items: Carousel_item[];
	supported_locales: string[];
	external_urls: External_url[];
	popular_application_command_ids: string[];
	popular_application_commands: Popular_application_command[];
	short_description: string;
}

export interface FullDiscoveryBot {
	id: string;
	name: string;
	icon?: string | null;
	description: string;
	summary: string;
	type?: any;
	primary_sku_id?: string | null;
	bot: Bot;
	hook: boolean;
	slug?: string | null;
	guild_id?: string | null;
	bot_public: boolean;
	bot_require_code_grant: boolean;
	terms_of_service_url?: string | null;
	privacy_policy_url?: string | null;
	install_params?: Install_param;
	verify_key: string;
	flags: number;
	guild?: Guild | null;
	tags: string[];
	categories: Category[];
	directory_entry: Directory_entry;
}
