import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, X, User } from 'lucide-react';
import { logout } from '../../redux/Slices/authSlice';
import LOGO from '/src/assets/image/LOGO.png';

export default function PhotoBookingHeader() {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.user);

  // Local state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // ✅ Lấy tên hiển thị từ Redux hoặc sessionStorage
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
  // CSS nội tuyến
  const styles = {
    header: {
      backgroundColor: '#ffffffff',
      borderBottom: '3px solid #9333ea',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
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
      transition: 'opacity 0.3s',
    },
    logoImage: {
      height: '70px',
      width: 'auto',
      objectFit: 'contain',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },
    navLink: {
      fontSize: '20px',
      fontWeight: '500',
      color: '#374151',
      textDecoration: 'none',
      transition: 'all 0.3s',
    },
    navLinkActive: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#9333ea',
      textDecoration: 'none',
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
      transition: 'all 0.3s',
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
      transition: 'all 0.3s',
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
    mobileNavLink: {
      display: 'block',
      padding: '12px 0',
      fontSize: '15px',
      fontWeight: '500',
      color: '#374151',
      textDecoration: 'none',
      transition: 'color 0.3s',
    },
    mobileNavLinkActive: {
      display: 'block',
      padding: '12px 0',
      fontSize: '15px',
      fontWeight: '500',
      color: '#9333ea',
      textDecoration: 'none',
    },
    mobileDivider: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px',
      marginTop: '16px',
    },
  };

  // CSS media query riêng (ẩn/hiện menu mobile)
  const mediaQueryStyles = `
    @media (max-width: 1024px) {
      .desktop-nav {
        display: none !important;
      }
      .desktop-auth {
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

    .nav-link:hover {
      color: #9333ea;
      transform: scale(1.08);
    }
  `;

  return (
    <>
      <style>{mediaQueryStyles}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.flexContainer}>
            {/* Logo */}
            <Link to="/" style={styles.logo}>
              <img src={LOGO} alt="PhotoBooking Logo" style={styles.logoImage} />
            </Link>

            {/* Navigation (Desktop) */}
            <nav style={styles.nav} className="desktop-nav">
              <Link
                to="/"
                style={isActive('/') ? styles.navLinkActive : styles.navLink}
              >
                Trang chủ
              </Link>
              <Link
                to="/photographers"
                style={
                  isActive('/photographers')
                    ? styles.navLinkActive
                    : styles.navLink
                }
              >
                Nhiếp ảnh gia
              </Link>
              <Link
                to="/service-package"
                style={
                  isActive('/service-package')
                    ? styles.navLinkActive
                    : styles.navLink
                }
              >
                Gói chụp
              </Link>
              <Link
                to="/activity"
                style={
                  isActive('/activity')
                    ? styles.navLinkActive
                    : styles.navLink
                }
              >
                Cách hoạt động
              </Link>
              <Link
                to="/about-web"
                style={isActive('/about-web') ? styles.navLinkActive : styles.navLink}
              >
                Về chúng tôi
              </Link>
            </nav>

            {/* Auth Buttons (Desktop) */}
            <div style={styles.authButtons} className="desktop-auth">
              {token ? (
                <>
                  <div style={styles.userInfo}>
                    <User size={28} color="#9333ea" />
                    <Link to="/my-account" style={{ color: '#4b5563' }}>
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
                  <Link to="/signin" style={styles.loginBtn}>
                    Đăng nhập
                  </Link>
                  <Link to="/signup" style={styles.registerBtn}>
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.mobileMenuBtn}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div style={styles.mobileMenu} className="mobile-menu">
            <div style={styles.mobileMenuContent}>
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                style={
                  isActive('/')
                    ? styles.mobileNavLinkActive
                    : styles.mobileNavLink
                }
              >
                Trang chủ
              </Link>
              <Link
                to="/photographers"
                onClick={() => setIsMenuOpen(false)}
                style={
                  isActive('/photographers')
                    ? styles.mobileNavLinkActive
                    : styles.mobileNavLink
                }
              >
                Nhiếp ảnh gia
              </Link>
              <Link
                to="/services"
                onClick={() => setIsMenuOpen(false)}
                style={
                  isActive('/services')
                    ? styles.mobileNavLinkActive
                    : styles.mobileNavLink
                }
              >
                Gói chụp
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setIsMenuOpen(false)}
                style={
                  isActive('/how-it-works')
                    ? styles.mobileNavLinkActive
                    : styles.mobileNavLink
                }
              >
                Cách hoạt động
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                style={
                  isActive('/about')
                    ? styles.mobileNavLinkActive
                    : styles.mobileNavLink
                }
              >
                Về chúng tôi
              </Link>

              {/* Auth Section (Mobile) */}
              {token ? (
                <div style={styles.mobileDivider}>
                  <div style={styles.userInfo}>
                    <User size={22} color="#9333ea" />
                    <span>{displayName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      ...styles.mobileNavLink,
                      background: 'none',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div style={styles.mobileDivider}>
                  <Link
                    to="/signin"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      ...styles.loginBtn,
                      display: 'block',
                      textAlign: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      ...styles.registerBtn,
                      display: 'block',
                      textAlign: 'center',
                    }}
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
