import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__name">SafeClick AI</span>
          <p className="site-footer__tagline">Clarity before every click.</p>
          <p className="site-footer__line">
            Built for clarity, privacy, and safer browsing.
          </p>
        </div>
        <div className="site-footer__links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
        <p className="site-footer__copy">© {year} SafeClick AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
