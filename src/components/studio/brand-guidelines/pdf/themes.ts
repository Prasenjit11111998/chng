import type { PDFTheme } from '../../../../lib/studio/types';

export const lightTheme: PDFTheme = {
  name: 'light',
  pageBackground: '#ffffff',
  pageText: '#111111',
  pageMuted: '#666666',
  accent: '#e8342b',
  coverBackground: '#ffffff',
  coverText: '#111111',
  sectionHeadingColor: '#111111',
  ruleColor: '#e0e0e0',
};

export const darkTheme: PDFTheme = {
  name: 'dark',
  pageBackground: '#0d0d0f',
  pageText: '#ececee',
  pageMuted: '#8c8c99',
  accent: '#e8342b',
  coverBackground: '#0d0d0f',
  coverText: '#ececee',
  sectionHeadingColor: '#ececee',
  ruleColor: '#e8342b',
};

export const THEMES: Record<string, PDFTheme> = {
  light: lightTheme,
  dark: darkTheme,
};
