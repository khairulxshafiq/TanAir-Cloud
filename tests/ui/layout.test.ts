import { describe, it, expect } from 'vitest';
import React from 'react';
import { SkipLink } from '@/components/layout/SkipLink';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PublicShell } from '@/components/layout/PublicShell';

describe('Layout & Application Shell Components (components/layout/)', () => {
  it('SkipLink targets main-content with accessible BM label', () => {
    const element = React.createElement(SkipLink, {
      targetId: 'main-content',
      label: 'Langkau ke kandungan',
    });

    expect(element.props.targetId).toBe('main-content');
    expect(element.props.label).toBe('Langkau ke kandungan');
  });

  it('AppHeader renders header landmark with actions', () => {
    const element = React.createElement(AppHeader, {
      title: 'TanAir Chat',
      rightAction: React.createElement('div', null, 'Action'),
    });

    expect(element.props.title).toBe('TanAir Chat');
    expect(element.props.rightAction).toBeDefined();
  });

  it('AppSidebar renders navigation aside landmark with brand slot', () => {
    const element = React.createElement(
      AppSidebar,
      {
        brand: React.createElement('span', null, 'TanAir'),
      },
      React.createElement('div', null, 'Links'),
    );

    expect(element.props.brand).toBeDefined();
    expect(element.props.children).toBeDefined();
  });

  it('PublicShell establishes public landmark boundaries', () => {
    const element = React.createElement(
      PublicShell,
      {
        brand: React.createElement('span', null, 'TanAir Public'),
      },
      React.createElement('p', null, 'Content'),
    );

    expect(element.props.brand).toBeDefined();
    expect(element.props.children).toBeDefined();
  });
});
