export interface Folder {
  name: string;
  files: Item[];
  subfolders: Folder[];
}

export const itemTypes = ['note', 'pdf', 'document', 'link', 'assignment', 'word', 'powerpoint', 'survey', 'activity', 'mp4'] as const;
export type ItemTypes = typeof itemTypes[number];
export interface Item {
  name: string;
  url: string;
  type: ItemTypes | 'unknown';
}

export type ItemWithPath = Item & { path: string }