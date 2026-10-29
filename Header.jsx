import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo">
          <span className="header__logo-text">ODYSSEY</span>
          <span className="header__logo-divider">/</span>
          <span className="header__logo-tagline">Your journey, intelligently planned.</span>
        </Link>
        <nav className="header__nav">
          <Link to="/" className="header__link">Plan Journey</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
