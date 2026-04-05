import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { ProfileDisplay } from '../ProfileDisplay.js';

const fullProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+1 555-0100',
  location: 'San Francisco, CA',
  about: 'Experienced software engineer.',
  linkedinUrl: 'https://linkedin.com/in/janedoe',
  githubUrl: 'https://github.com/janedoe',
  websiteUrl: 'https://janedoe.dev'
};

const minimalProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: null,
  location: null,
  about: null,
  linkedinUrl: null,
  githubUrl: null,
  websiteUrl: null
};

describe('ProfileDisplay', () => {
  test('renders all fields as text, not inputs', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    expect(screen.getByText('Jane')).toBeDefined();
    expect(screen.getByText('Doe')).toBeDefined();
    expect(screen.getByText('jane@example.com')).toBeDefined();
    expect(screen.getByText('+1 555-0100')).toBeDefined();
    expect(screen.getByText('San Francisco, CA')).toBeDefined();
    expect(screen.getByText('Experienced software engineer.')).toBeDefined();

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('input')).toBeNull();
  });

  test('renders links as anchor tags with correct href', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    const githubLink = screen.getByRole('link', { name: 'github.com/janedoe' });
    expect(githubLink.getAttribute('href')).toBe('https://github.com/janedoe');
    expect(githubLink.getAttribute('target')).toBe('_blank');

    const linkedinLink = screen.getByRole('link', { name: 'linkedin.com/in/janedoe' });
    expect(linkedinLink.getAttribute('href')).toBe('https://linkedin.com/in/janedoe');

    const websiteLink = screen.getByRole('link', { name: 'janedoe.dev' });
    expect(websiteLink.getAttribute('href')).toBe('https://janedoe.dev');
  });

  test('strips https:// prefix from link display text', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    expect(screen.getByText('github.com/janedoe')).toBeDefined();
    expect(screen.getByText('linkedin.com/in/janedoe')).toBeDefined();
    expect(screen.getByText('janedoe.dev')).toBeDefined();
  });

  test('shows "Not set" for null optional fields', () => {
    render(<ProfileDisplay profile={minimalProfile} />);

    const notSetElements = screen.getAllByText('Not set');
    // phone, location, about, linkedinUrl, githubUrl, websiteUrl = 6 null fields
    expect(notSetElements.length).toBe(6);
  });

  test('renders required fields even in minimal profile', () => {
    render(<ProfileDisplay profile={minimalProfile} />);

    expect(screen.getByText('Jane')).toBeDefined();
    expect(screen.getByText('Doe')).toBeDefined();
    expect(screen.getByText('jane@example.com')).toBeDefined();
  });

  test('renders group labels', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    expect(screen.getByText('Identity')).toBeDefined();
    expect(screen.getByText('Contact')).toBeDefined();
    expect(screen.getByText('About')).toBeDefined();
    expect(screen.getByText('Links')).toBeDefined();
  });
});
