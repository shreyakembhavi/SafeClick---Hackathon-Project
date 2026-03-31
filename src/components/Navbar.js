import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <Link to="/" className="site-logo" aria-label="SafeClick AI home">
          <span className="site-logo__mark" aria-hidden="true" />
          <span className="site-logo__text">
            SafeClick <span className="site-logo__ai">AI</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
            }
          >
            How It Works
          </NavLink>
          <Link to="/pricing" className="site-nav__cta">
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}
