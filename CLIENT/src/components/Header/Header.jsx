import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, X, User } from 'lucide-react';
import { logout } from '../../redux/Slices/authSlice';
import LOGO from '/src/assets/image/LOGO.png';

export default function PhotoBookingHeader() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.user);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const displayName = (() => {
    try {
      return (
        user?.HoTen ||
        user?.TenDangNhap ||
        sessionStorage.getItem('username') ||
        'Tài khoản'
      );
    } catch (error) {
      return 'Tài khoản';
    }
  })();

  const styles = {
    header: {
      backgroundColor: '#fff',
      borderBottom: '3px solid #9333ea',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
    },
    flexContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '80px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
      transition: 'transform 0.3s ease',
    },
    logoImage: {
      height: '70px',
      width: 'auto',
      objectFit: 'contain',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '36px',
    },
    navLink: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#374151',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      padding: '6px 10px',
      borderRadius: '8px',
    },
    navLinkActive: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#9333ea',
      textDecoration: 'none',
      borderBottom: '2px solid #9333ea',
      paddingBottom: '4px',
    },
    authButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    loginBtn: {
      padding: '10px 24px',
      color: '#9333ea',
      fontWeight: '600',
      border: '2px solid #9333ea',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
    },
    registerBtn: {
      padding: '10px 24px',
      backgroundColor: '#9333ea',
      color: '#ffffff',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      color: '#4b5563',
      fontWeight: '500',
      fontSize: '18px',
    },
    mobileMenuBtn: {
      display: 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      color: '#374151',
    },
    mobileMenu: {
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    mobileMenuContent: {
      padding: '16px 24px',
    },
  };

  const mediaQueryStyles = `
    @media (max-width: 1024px) {
      .desktop-nav, .desktop-auth {
        display: none !important;
      }
      .mobile-menu-btn {
        display: block !important;
      }
    }

    @media (min-width: 1025px) {
      .mobile-menu {
        display: none !important;
      }
    }

    /* 🌟 Hiệu ứng hover mượt và nổi bật */
    .nav-link:hover {
      color: #9333ea;
      transform: translateY(-2px);
      text-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
    }

    .login-btn:hover {
      background-color: #9333ea;
      color: #fff;
      box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
      transform: scale(1.05);
    }

    .register-btn:hover {
      background-color: #7e22ce;
      box-shadow: 0 4px 12px rgba(147, 51, 234, 0.5);
      transform: scale(1.05);
    }

    .logo:hover {
      transform: scale(1.05) rotate(-1deg);
      filter: drop-shadow(0 3px 8px rgba(147, 51, 234, 0.3));
    }

    button, a {
      transition: all 0.3s ease;
    }
  `;

  return (
    <>
      <style>{mediaQueryStyles}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.flexContainer}>
            <Link to="/" style={styles.logo} className="logo">
              <img src={LOGO} alt="PhotoBooking Logo" style={styles.logoImage} />
            </Link>

            <nav style={styles.nav} className="desktop-nav">
              {[
                { path: '/', label: 'Trang chủ' },
                { path: '/photographers', label: 'Nhiếp ảnh gia' },
                { path: '/service-package', label: 'Gói dịch vụ' },
                { path: '/activity', label: 'Cách hoạt động' },
                { path: '/about-web', label: 'Về chúng tôi' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={
                    isActive(item.path)
                      ? styles.navLinkActive
                      : styles.navLink
                  }
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div style={styles.authButtons} className="desktop-auth">
              {token ? (
                <>
                  <div style={styles.userInfo}>
                    <User size={28} color="#9333ea" />
                    <Link to="/my-account" style={{ color: '#4b5563', textDecoration: 'none' }}>
                      {displayName}
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={styles.loginBtn}
                    className="login-btn"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    style={styles.loginBtn}
                    className="login-btn"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/signup"
                    style={styles.registerBtn}
                    className="register-btn"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.mobileMenuBtn}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div style={styles.mobileMenu} className="mobile-menu">
            <div style={styles.mobileMenuContent}>
              {[
                { path: '/', label: 'Trang chủ' },
                { path: '/photographers', label: 'Nhiếp ảnh gia' },
                { path: '/service-package', label: 'Gói dịch vụ' },
                { path: '/activity', label: 'Cách hoạt động' },
                { path: '/about-web', label: 'Về chúng tôi' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  style={
                    isActive(item.path)
                      ? { color: '#9333ea', fontWeight: 600 }
                      : { color: '#374151' }
                  }
                  className="block py-2 text-lg" // Class Tailwind
                >
                  {item.label}
                </Link>
              ))}

              {token ? (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={22} color="#9333ea" />
                    <span>{displayName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-left w-full text-gray-600 hover:text-purple-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="mt-4 border-t border-gray-200 pt-3 flex flex-col gap-2">
                  <Link
                    to="/signin"
                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-center hover:bg-purple-600 hover:text-white transition"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700 transition"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}