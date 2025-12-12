export enum ViewState {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_SIGNUP = 'AUTH_SIGNUP',
  AUTH_VERIFY = 'AUTH_VERIFY',
  HOME = 'HOME',
  MAP = 'MAP',
  CHATS = 'CHATS',
  CHAT_DETAIL = 'CHAT_DETAIL', // New view for active chat
  PROFILE = 'PROFILE',
  MARKETPLACE = 'MARKETPLACE',
  ADMIN = 'ADMIN',
  CREATE_POST = 'CREATE_POST' // Typically a modal, but can be a view state for simplicity
}

export enum PostCategory {
  ALL = 'All',
  HELP = 'Help',
  IDEAS = 'Ideas',
  EVENTS = 'Events',
  MARKETPLACE = 'Marketplace',
  SAFETY = 'Safety'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  reputation: number;
  isVerified: boolean;
  isAdmin?: boolean; // New Role Flag
}

export interface Post {
  id: string;
  author: User;
  category: PostCategory;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  alertLevel?: 'emergency' | 'warning' | 'info';
  // New Enhanced Fields
  title?: string;
  price?: string;
  eventDate?: string;
}

export interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isAi?: boolean; // Identify AI chat
}

export interface MarketItem {
  id: string;
  title: string;
  price: string; // "$20" or "Free"
  image: string;
  seller: string;
  location: string;
}