import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main page-main--legal">
        <p className="page-kicker">Privacy</p>
        <h1 className="page-title">Privacy Policy</h1>
        <p className="legal-meta">Last updated: March 30, 2026</p>

        <div className="legal-content">
          <p>
            SafeClick AI is designed with privacy in mind. This policy describes how we handle
            information when you use our public scan tools.
          </p>

          <h2>What we process</h2>
          <p>
            When you submit a URL or image for scanning, we process that content only to produce
            a safety assessment. We do not use your submissions to train third-party models.
          </p>

          <h2>Retention</h2>
          <p>
            Scans are processed to return a result. We do not intend to retain URLs or images
            beyond what is necessary for the service to function during your session.
          </p>

          <h2>Cookies &amp; analytics</h2>
          <p>
            The public beta may use minimal local storage (for example, daily scan limits on the
            free tier). We do not sell your data.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? Reach us at{' '}
            <a href="mailto:contact@safeclick.ai">contact@safeclick.ai</a>.
          </p>
        </div>

        <Link to="/" className="btn btn--ghost btn--back">
          ← Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
