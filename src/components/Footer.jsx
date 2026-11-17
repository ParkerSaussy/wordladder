/**
 * Word Ladder
 * Copyright (c) Parker & Gordon Saussy. All rights reserved.
 * This code and the Word Ladder game concept/design are credited to
 * Gordon Saussy and Parker Saussy. Built with React & Vercel.
 * See the LICENSE file for usage terms.
 */

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p>
        © {year} Parker &amp; Gordon Saussy. All rights reserved. Built with{' '}
        <a href="https://react.dev/" target="_blank" rel="noreferrer">
          React
        </a>{' '}
        &amp; deployed with{' '}
        <a href="https://vercel.com/" target="_blank" rel="noreferrer">
          Vercel
        </a>
        .
      </p>
    </footer>
  );
}
