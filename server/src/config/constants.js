// Data kategori sama persis dengan desain (sl-data.js). Kategori jarang berubah,
// jadi cukup disimpan di kode, tidak perlu collection sendiri.
export const CATEGORIES = [
  { id: 'programming', name: 'Programming', tint: '#DCE8F7', ink: '#1F4E8C', description: 'Web development, JavaScript and React, from first lines of code to small working apps.' },
  { id: 'design', name: 'Graphic Design', tint: '#F8E3DA', ink: '#A4472A', description: 'UI basics, color, layout and Figma, with exercises you can add to a portfolio.' },
  { id: 'marketing', name: 'Digital Marketing', tint: '#F6ECCF', ink: '#7A5510', description: 'SEO, content and social ads, explained with real campaign examples.' },
  { id: 'technology', name: 'Technology', tint: '#DCEEE3', ink: '#2D6B4A', description: 'Cloud, Git and the everyday tools used by tech teams.' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const LESSON_TYPES = ['Video', 'Article', 'Quiz', 'Practice'];
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const ROLES = ['student', 'admin'];

export const ACCESS_TOKEN_TTL = 15 * 60; // detik
export const REFRESH_SLIDING_DAYS = 7;
export const REFRESH_ABSOLUTE_DAYS = 30;
export const VERIFY_TOKEN_HOURS = 24;
export const RESET_TOKEN_MINUTES = 30;
export const AVATAR_MAX_BYTES = 60 * 1024;
