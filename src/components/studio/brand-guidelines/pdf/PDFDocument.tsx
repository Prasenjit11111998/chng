// PDF Document — rendered via @react-pdf/renderer (lazy-imported)
// This file is NOT imported at app startup.
// Studio Hornbill — award-winning brand guidelines PDF layout

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { BrandData, PDFSection, PDFTheme } from '../../../../lib/studio/types';
import { deriveColorStrings, normalizeHex } from '../../../../lib/studio/colorUtils';
import { THEMES } from './themes';

// ─── Layout Constants ──────────────────────────────────────────────────────────
// A4 Landscape: 841.89 × 595.28 pt

const PAGE_W = 841.89;
const PAGE_H = 595.28;

// Spacing scale
const SP = {
  xs:  8,
  sm: 16,
  md: 32,
  lg: 48,
  xl: 64,
  xxl: 96,
};

// ─── Resolved Fonts Prop ──────────────────────────────────────────────────────

export interface ResolvedFonts {
  heading: string;
  body: string;
}

// ─── Luminance helper ──────────────────────────────────────────────────────────

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function contrastText(hex: string): '#111111' | '#ffffff' {
  return luminance(hex) > 0.45 ? '#111111' : '#ffffff';
}

// ─── Shared Styles Factory ─────────────────────────────────────────────────────

function makeStyles(theme: PDFTheme, fonts: ResolvedFonts) {
  return StyleSheet.create({
    page: {
      width: PAGE_W,
      height: PAGE_H,
      backgroundColor: theme.pageBackground,
      flexDirection: 'row',
      fontFamily: fonts.body,
    },

    // ── Columns ─────────────────────────────────────────────────
    col: {
      flex: 1,
      padding: SP.lg,
      flexDirection: 'column',
    },
    colCenter: {
      flex: 1,
      padding: SP.lg,
      flexDirection: 'column',
      justifyContent: 'center',
    },

    // ── Typography ───────────────────────────────────────────────
    eyebrow: {
      fontFamily: fonts.body,
      fontSize: 8,
      fontWeight: 700,
      color: theme.accent,
      textTransform: 'uppercase',
      letterSpacing: 2.5,
      marginBottom: SP.sm,
    },
    h1: {
      fontFamily: fonts.heading,
      fontSize: 52,
      fontWeight: 700,
      color: theme.coverText,
      letterSpacing: -1.2,
      lineHeight: 1.0,
      marginBottom: SP.sm,
    },
    h2: {
      fontFamily: fonts.heading,
      fontSize: 32,
      fontWeight: 700,
      color: theme.sectionHeadingColor,
      letterSpacing: -0.6,
      lineHeight: 1.1,
      marginBottom: 0,
    },
    h3: {
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: 700,
      color: theme.sectionHeadingColor,
      letterSpacing: -0.2,
      marginBottom: SP.xs,
    },
    tagline: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: theme.coverText,
      opacity: 0.65,
      lineHeight: 1.6,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: theme.pageText,
      lineHeight: 1.8,
    },
    muted: {
      fontFamily: fonts.body,
      fontSize: 9,
      color: theme.pageMuted,
      lineHeight: 1.6,
    },

    // ── Page number ─────────────────────────────────────────────
    pageNum: {
      position: 'absolute',
      bottom: SP.md,
      right: SP.lg,
      fontSize: 9,
      fontWeight: 700,
      color: theme.pageMuted,
      letterSpacing: 1.5,
      fontFamily: fonts.body,
    },

    // ── Section header bar ──────────────────────────────────────
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SP.xl,
      paddingTop: SP.xl,
      paddingBottom: SP.lg,
    },

    // ── Logo contained display ───────────────────────────────────
    logoContain: {
      width: 160,
      height: 80,
      objectFit: 'contain',
    },
    logoContainSm: {
      width: 120,
      height: 56,
      objectFit: 'contain',
    },
  });
}

// ─── Cover Page ────────────────────────────────────────────────────────────────

function PDFCover({
  data, theme, styles, fonts,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles>; fonts: ResolvedFonts }) {
  const primaryColor = data.colors[0]?.hex ?? theme.accent;
  const onPrimary = contrastText(primaryColor);

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.coverBackground, flexDirection: 'row' }}>

      {/* ── Left panel: solid brand-color with logo ── */}
      <View style={{
        width: 240,
        backgroundColor: primaryColor,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SP.xl,
      }}>
        {data.logos.icon ? (
          <Image
            src={data.logos.icon}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        ) : data.logos.light ? (
          // Light logo on colored/dark bg
          <Image
            src={data.logos.light}
            style={{ width: 160, height: 80, objectFit: 'contain' }}
          />
        ) : data.logos.primary ? (
          <Image
            src={data.logos.primary}
            style={{ width: 160, height: 80, objectFit: 'contain' }}
          />
        ) : (
          <Text style={{
            fontFamily: fonts.heading,
            fontSize: 36,
            fontWeight: 700,
            color: onPrimary,
            letterSpacing: -1,
          }}>
            {data.brandName || 'Brand'}
          </Text>
        )}
      </View>

      {/* ── Right panel: brand info ── */}
      <View style={{
        flex: 1,
        backgroundColor: theme.coverBackground,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: SP.xl,
        paddingLeft: SP.lg,
      }}>
        {/* Eyebrow */}
        <Text style={[styles.eyebrow, { marginBottom: SP.md }]}>Brand Identity</Text>

        {/* Brand name */}
        <Text style={styles.h1}>
          {data.brandName || 'Brand Name'}
        </Text>

        {/* Tagline */}
        {data.tagline && (
          <Text style={[styles.tagline, { marginBottom: SP.lg }]}>
            {data.tagline}
          </Text>
        )}

        {/* Bottom metadata row */}
        <View style={{ position: 'absolute', bottom: SP.lg, left: SP.lg, right: SP.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.muted}>Brand Guidelines</Text>
            {data.website && <Text style={styles.muted}>{data.website}</Text>}
          </View>
        </View>
      </View>
    </Page>
  );
}

// ─── About Page ────────────────────────────────────────────────────────────────

function PDFAbout({
  data, theme, styles,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles> }) {
  const primaryColor = data.colors[0]?.hex ?? theme.accent;
  const onPrimary = contrastText(primaryColor);

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'row' }}>


      {/* ── Left sidebar: big section label ── */}
      <View style={{
        width: 240,
        backgroundColor: primaryColor,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: SP.lg,
      }}>
        {/* Giant ghost number */}
        <Text style={{
          fontFamily: styles.h1.fontFamily,
          fontSize: 120,
          fontWeight: 700,
          color: onPrimary === '#111111' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          lineHeight: 1,
          position: 'absolute',
          top: SP.lg,
          left: SP.lg,
        }}>01</Text>

        <Text style={{
          fontFamily: styles.h2.fontFamily,
          fontSize: 24,
          fontWeight: 700,
          color: onPrimary,
          lineHeight: 1.2,
          marginBottom: SP.sm,
        }}>About the{'\n'}Brand</Text>
        <View style={{ height: 2, backgroundColor: onPrimary === '#111111' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)', width: 28 }} />
      </View>

      {/* ── Right: description ── */}
      <View style={{ flex: 1, padding: SP.lg, flexDirection: 'column', justifyContent: 'center' }}>
        <Text style={styles.eyebrow}>Overview</Text>
        <Text style={[styles.body, { fontSize: 12, lineHeight: 2.0, marginBottom: SP.md }]}>
          {data.description || 'Brand description not provided.'}
        </Text>
        {data.website && (
          <Text style={styles.muted}>{data.website}</Text>
        )}
      </View>

      <Text style={styles.pageNum}>01</Text>
    </Page>
  );
}

// ─── Logo System Page ──────────────────────────────────────────────────────────

function PDFLogoSystem({
  data, theme, styles,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles> }) {
  // Correct pairing: dark version on light bg, light version on dark bg
  const slots = [
    { key: 'primary' as const, label: 'Primary Logo',    bg: theme.name === 'dark' ? '#141416' : '#f8f8f8', isLight: theme.name === 'dark' },
    { key: 'dark'    as const, label: 'Dark Version',    bg: '#f5f5f5',  isLight: false },
    { key: 'light'   as const, label: 'Light Version',   bg: '#111111',  isLight: true  },
    { key: 'icon'    as const, label: 'Brand Icon',      bg: data.colors[0]?.hex ?? theme.accent, isLight: true },
  ];

  const activeSlots = slots.filter((s) => data.logos[s.key]);
  const count = activeSlots.length || 1;

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>

      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.h2}>Logo System</Text>
      </View>

      {/* ── Logo grid — equal-width cells ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {activeSlots.map((slot, i) => {
          const labelColor = contrastText(slot.bg) === '#111111' ? '#555555' : '#aaaaaa';
          return (
            <View
              key={slot.key}
              style={{
                flex: 1,
                backgroundColor: slot.bg,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: SP.md,
                paddingVertical: SP.lg,
              }}
            >
              <Image
                src={data.logos[slot.key]!}
                style={{
                  width: count <= 2 ? 200 : 140,
                  height: count <= 2 ? 100 : 72,
                  objectFit: 'contain',
                  marginBottom: SP.md,
                }}
              />
              <Text style={{
                fontSize: 8,
                color: labelColor,
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontFamily: styles.muted.fontFamily,
              }}>
                {slot.label}
              </Text>
            </View>
          );
        })}

        {activeSlots.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.muted}>No logos uploaded.</Text>
          </View>
        )}
      </View>

      <Text style={styles.pageNum}>02</Text>
    </Page>
  );
}

// ─── Color Palette Page ────────────────────────────────────────────────────────

function PDFColorPalette({
  data, theme, styles,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles> }) {
  const colors = data.colors.length > 0 ? data.colors : [];

  if (colors.length === 0) {
    return (
      <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.h2}>Color Palette</Text>
        </View>
        <Text style={[styles.muted, { marginHorizontal: SP.lg }]}>No colors defined.</Text>
        <Text style={styles.pageNum}>03</Text>
      </Page>
    );
  }

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>
      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.h2}>Color Palette</Text>
      </View>

      {/* ── Full-bleed color columns ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {colors.map((color, i) => {
          const derived = deriveColorStrings(color.hex);
          const txtColor = contrastText(color.hex);
          const mutedClr = txtColor === '#111111' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)';

          return (
            <View
              key={color.id}
              style={{
                flex: 1,
                backgroundColor: color.hex,
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: SP.md,
              }}
            >
              <Text style={{
                fontFamily: styles.h3.fontFamily,
                fontSize: 14,
                fontWeight: 700,
                color: txtColor,
                marginBottom: 5,
              }}>
                {color.name || 'Unnamed'}
              </Text>
              <Text style={{ fontSize: 11, color: txtColor, fontWeight: 700, marginBottom: 4 }}>
                {normalizeHex(color.hex).toUpperCase()}
              </Text>
              {derived.rgb && <Text style={{ fontSize: 8, color: mutedClr, marginBottom: 2 }}>RGB {derived.rgb}</Text>}
              {derived.cmyk && <Text style={{ fontSize: 8, color: mutedClr }}>CMYK {derived.cmyk}</Text>}
            </View>
          );
        })}
      </View>

      <Text style={styles.pageNum}>03</Text>
    </Page>
  );
}

// ─── Typography Page ───────────────────────────────────────────────────────────

function PDFTypography({
  data, theme, styles, fonts,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles>; fonts: ResolvedFonts }) {
  const { headingFont, bodyFont } = data.typography;

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>
      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.h2}>Typography</Text>
      </View>

      {/* ── Two-column type display ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Heading font */}
        <View style={{
          flex: 1,
          padding: SP.md,
          paddingTop: SP.sm,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={styles.eyebrow}>Heading Font</Text>
            <Text style={{
              fontFamily: fonts.heading,
              fontSize: 12,
              fontWeight: 700,
              color: theme.pageText,
              marginBottom: SP.sm,
            }}>
              {headingFont || 'Default'}
            </Text>
            {/* Giant Aa specimen */}
            <Text style={{
              fontFamily: fonts.heading,
              fontSize: 112,
              fontWeight: 700,
              color: theme.sectionHeadingColor,
              lineHeight: 0.9,
              letterSpacing: -2.5,
              opacity: 0.9,
            }}>
              Aa
            </Text>
          </View>
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: theme.pageText, letterSpacing: 0.3, marginBottom: 4 }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </Text>
            <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: theme.pageText, letterSpacing: 0.3 }}>
              abcdefghijklmnopqrstuvwxyz 0–9
            </Text>
          </View>
        </View>

        {/* Body font */}
        <View style={{
          flex: 1,
          padding: SP.md,
          paddingTop: SP.sm,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={styles.eyebrow}>Body Font</Text>
            <Text style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 700,
              color: theme.pageText,
              marginBottom: SP.sm,
            }}>
              {bodyFont || 'Default'}
            </Text>

            {/* Size ramp */}
            {[
              { size: 26, weight: 700 as const, label: '26 / Bold' },
              { size: 18, weight: 400 as const, label: '18 / Regular' },
              { size: 12, weight: 400 as const, label: '12 / Regular' },
            ].map(({ size, weight, label }) => (
              <View key={label} style={{ marginBottom: SP.sm }}>
                <Text style={{
                  fontFamily: fonts.body,
                  fontSize: size,
                  fontWeight: weight,
                  color: theme.pageText,
                  lineHeight: 1.1,
                }}>
                  The quick brown fox
                </Text>
                <Text style={{ fontSize: 7, color: theme.pageMuted, marginTop: 3 }}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.pageMuted, lineHeight: 1.7 }}>
            Typography shapes how a brand speaks before a single word is read.
          </Text>
        </View>
      </View>

      <Text style={styles.pageNum}>04</Text>
    </Page>
  );
}

// ─── Brand Applications Page ───────────────────────────────────────────────────

function PDFApplications({
  data, theme, styles, fonts,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles>; fonts: ResolvedFonts }) {
  const primaryColor = data.colors[0]?.hex ?? theme.accent;
  const secondaryColor = data.colors[1]?.hex ?? (theme.name === 'dark' ? '#1c1c1f' : '#111111');
  const onPrimary = contrastText(primaryColor);

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>
      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.h2}>Brand Applications</Text>
      </View>

      {/* ── Two mockup panels ── */}
      <View style={{ flex: 1, flexDirection: 'row', padding: SP.lg, paddingTop: SP.md, gap: SP.md }}>

        {/* Website Header mockup */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <Text style={[styles.eyebrow, { marginBottom: SP.xs }]}>Website Header</Text>
          <View style={{
            flex: 1,
            backgroundColor: secondaryColor,
            padding: SP.md,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            {/* Nav */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {data.logos.primary ? (
                <Image src={data.logos.primary} style={{ height: 24, width: 90, objectFit: 'contain' }} />
              ) : (
                <Text style={{ fontFamily: fonts.heading, color: '#ececee', fontSize: 14, fontWeight: 700 }}>
                  {data.brandName || 'Brand'}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {['About', 'Work', 'Contact'].map((l) => (
                  <Text key={l} style={{ fontFamily: fonts.body, color: '#8c8c99', fontSize: 8 }}>{l}</Text>
                ))}
              </View>
            </View>

            {/* Hero text */}
            <View>
              <Text style={{
                fontFamily: fonts.heading,
                fontSize: 24,
                fontWeight: 700,
                color: '#ececee',
                letterSpacing: -0.6,
                lineHeight: 1.2,
                marginBottom: 10,
              }}>
                {data.tagline || `${data.brandName || 'Your Brand'}.`}
              </Text>
              {/* CTA */}
              <View style={{
                backgroundColor: primaryColor,
                paddingTop: 6, paddingBottom: 6,
                paddingLeft: 14, paddingRight: 14,
                alignSelf: 'flex-start',
              }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 9, color: onPrimary, fontWeight: 700 }}>
                  Get Started
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Social / Business card mockup */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <Text style={[styles.eyebrow, { marginBottom: SP.xs }]}>Social Media Header</Text>
          <View style={{
            flex: 1,
            backgroundColor: primaryColor,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SP.md,
          }}>
            {data.logos.light ? (
              <Image src={data.logos.light} style={{ width: 160, height: 72, objectFit: 'contain', marginBottom: SP.xs }} />
            ) : data.logos.primary ? (
              <Image src={data.logos.primary} style={{ width: 160, height: 72, objectFit: 'contain', marginBottom: SP.xs }} />
            ) : (
              <Text style={{ fontFamily: fonts.heading, color: onPrimary, fontSize: 24, fontWeight: 900, marginBottom: SP.xs }}>
                {data.brandName || 'Brand'}
              </Text>
            )}
            {data.tagline && (
              <Text style={{
                fontFamily: fonts.body,
                color: onPrimary,
                opacity: 0.75,
                fontSize: 10,
                textAlign: 'center',
              }}>
                {data.tagline}
              </Text>
            )}
          </View>
        </View>

      </View>

      <Text style={styles.pageNum}>05</Text>
    </Page>
  );
}

// ─── Logo Rules Page ───────────────────────────────────────────────────────────

function PDFLogoRules({
  data, theme, styles, fonts,
}: { data: BrandData; theme: PDFTheme; styles: ReturnType<typeof makeStyles>; fonts: ResolvedFonts }) {
  const dos = [
    'Maintain required clearspace around the logo on all sides',
    'Use only the approved color variants provided',
    `Respect the minimum size (${data.logoRules.minSize || 'see specification'})`,
    'Use the provided logo files — never recreate from scratch',
    'Ensure sufficient contrast with the background',
  ];
  const donts = [
    'Stretch, skew or distort the logo in any way',
    'Rotate or flip the logo',
    'Add drop shadows, glows or effects',
    'Change or mix the logo colors',
    'Place on busy or low-contrast backgrounds',
    'Outline or rearrange logo elements',
  ];

  const doBg   = theme.name === 'dark' ? '#0b1d14' : '#f0faf5';
  const dontBg = theme.name === 'dark' ? '#1d0b0b' : '#fff5f5';

  return (
    <Page size={[PAGE_W, PAGE_H]} style={{ backgroundColor: theme.pageBackground, flexDirection: 'column' }}>
      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.h2}>Logo Usage Rules</Text>
      </View>

      {/* ── Do / Don't columns ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Do */}
        <View style={{
          flex: 1,
          backgroundColor: doBg,
          padding: SP.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: '#2ea87a',
              justifyContent: 'center', alignItems: 'center', marginRight: 8,
            }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 700 }}>✓</Text>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: '#2ea87a' }}>Do</Text>
          </View>
          {dos.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: '#2ea87a', marginRight: 8, marginTop: 1 }}>✓</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.pageText, flex: 1, lineHeight: 1.6 }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Don't */}
        <View style={{
          flex: 1,
          backgroundColor: dontBg,
          padding: SP.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: '#e8342b',
              justifyContent: 'center', alignItems: 'center', marginRight: 8,
            }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 700 }}>✕</Text>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: '#e8342b' }}>Don't</Text>
          </View>
          {donts.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: '#e8342b', marginRight: 8, marginTop: 1 }}>✕</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.pageText, flex: 1, lineHeight: 1.6 }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.pageNum}>06</Text>
    </Page>
  );
}

// ─── PDF Document Root ─────────────────────────────────────────────────────────

interface PDFDocumentProps {
  data: BrandData;
  themeName: string;
  sectionOrder: PDFSection[];
  resolvedFonts: ResolvedFonts;
}

export const BrandPDFDocument: React.FC<PDFDocumentProps> = ({
  data, themeName, sectionOrder, resolvedFonts,
}) => {
  const theme = THEMES[themeName] ?? THEMES.light;
  const styles = makeStyles(theme, resolvedFonts);

  const renderSection = (section: PDFSection) => {
    const props = { data, theme, styles, fonts: resolvedFonts };
    switch (section) {
      case 'cover':              return <PDFCover key="cover" {...props} />;
      case 'about':              return <PDFAbout key="about" {...props} />;
      case 'logo-system':        return <PDFLogoSystem key="logo-system" {...props} />;
      case 'clearspace':
      case 'min-size':
        return null; // Shown in browser preview only
      case 'color-palette':      return <PDFColorPalette key="color-palette" {...props} />;
      case 'typography':         return <PDFTypography key="typography" {...props} />;
      case 'brand-applications': return <PDFApplications key="brand-applications" {...props} />;
      case 'logo-rules':         return <PDFLogoRules key="logo-rules" {...props} />;
      default:                   return null;
    }
  };

  return (
    <Document
      title={`${data.brandName || 'Brand'} — Brand Guidelines`}
      author={data.brandName || 'Chng Studio'}
      creator="Chng Studio"
    >
      {sectionOrder.map(renderSection)}
    </Document>
  );
};
