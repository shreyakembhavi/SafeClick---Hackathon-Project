import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

const Terms = () => {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main page-main--legal">
        <p className="page-kicker">Legal</p>
        <h1 className="page-title">Terms of Service</h1>
        <p className="legal-meta">Effective date: April 11, 2025</p>

        <div className="legal-content">
          <p>
            Welcome to SafeClick AI. These Terms of Service (&quot;Terms&quot;) and our Privacy Policy
            govern your use of our website and services. By using SafeClick AI, you agree to these
            Terms. If you do not agree, please do not use our site.
          </p>

          <h2>Our service</h2>
          <p>
            SafeClick AI provides tools to help you assess the safety of URLs and images using
            automated analysis. It is for informational and educational purposes and is not a
            substitute for professional security advice or enterprise-grade tooling.
          </p>

          <h2>User responsibilities</h2>
          <ol>
            <li>You agree to use SafeClick AI only for lawful purposes.</li>
            <li>You must not upload malicious, illegal, or harmful content.</li>
            <li>You are responsible for content you submit through the service.</li>
          </ol>

          <h2>Privacy and data</h2>
          <p>
            We respect your privacy. Submitted URLs and files may be processed to produce an
            assessment; we do not intend to retain them longer than necessary for the scan.
          </p>

          <h2>No guarantees</h2>
          <p>
            We strive for accurate results but cannot guarantee that every analysis is complete or
            correct. Use judgment and consult professionals for high-stakes decisions.
          </p>

          <h2>Modifications</h2>
          <p>
            We may update these Terms from time to time. Continued use of the site means you accept
            the updated Terms.
          </p>

          <h2>Children&apos;s privacy</h2>
          <p>SafeClick AI is not intended for users under 13.</p>

          <h2>Cookies and tracking</h2>
          <p>We minimize tracking; the free tier may use local storage for daily scan limits.</p>

          <h2>Data retention</h2>
          <p>
            We do not intend to permanently store URLs or files you submit; data is processed to
            return a result and then discarded as described in our Privacy Policy.
          </p>

          <h2>Security</h2>
          <p>
            We use secure communication where applicable. No system is perfectly secure—use at your
            own risk.
          </p>

          <h2>Your rights</h2>
          <ul>
            <li>Request information about data we hold, where applicable.</li>
            <li>Request deletion of retained information, where applicable.</li>
          </ul>
          <p>
            Contact us at{' '}
            <a href="mailto:contact@safeclick.ai">contact@safeclick.ai</a>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms or our Privacy Policy? Email{' '}
            <a href="mailto:contact@safeclick.ai">contact@safeclick.ai</a>.
          </p>

          <p>
            By using SafeClick AI, you acknowledge that you have read and agree to these Terms and
            our Privacy Policy. Thank you for using our service responsibly.
          </p>
        </div>

        <Link to="/" className="btn btn--ghost btn--back">
          ← Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
