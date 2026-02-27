import type { ReactNode } from 'react';

export interface IMeetingTemplate {
  name: string;
  frequency: string;
  agendaItems: string[];
}

export interface IRaciRow {
  activity: string;
  px: string;
  pm: string;
  super: string;
  pe: string;
}

export interface IQCChecklist {
  name: string;
  items: string[];
}

export interface IDocumentCategory {
  name: string;
  icon: ReactNode;
  fileCount: number;
  lastModified: string;
  description: string;
  recentFiles: { name: string; type: string; size: string; modified: string }[];
}

export interface IBestPractice {
  title: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  text: string;
}
