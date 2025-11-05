import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function PhotoBookingFooter() {
  const styles = {
    footer: {
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      paddingTop: '60px',
      paddingBottom: '30px',
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px',
      marginBottom: '40px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#9333ea',
      marginBottom: '20px',
    },
    sectionText: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: '1.7',
      marginBottom: '20px',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    linkItem: {
      marginBottom: '12px',
    },
    link: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      textDecoration: 'none',
      transition: 'color 0.3s',
      display: 'inline-block',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    socialLinks: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    socialIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: 'rgba(147, 51, 234, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '1px solid rgba(147, 51, 234, 0.3)',
    },
    divider: {
      height: '1px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginTop: '40px',
      marginBottom: '30px',
    },
    bottomSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '20px',
    },
    copyright: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.5)',
    },
    bottomLinks: {
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
    },
    logoText: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#9333ea',
    },
  };

  const hoverStyles = `
    .footer-link:hover {
      color: #ffffff;
      padding-left: 8px;
    }
    .social-icon:hover {
      background-color: #9333ea;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
    }
    @media (max-width: 768px) {
      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
      .footer-bottom-links {
        flex-direction: column;
        gap: 12px;
      }
    }
  `;

  return (
    <>
      <style>{hoverStyles}</style>
      <footer style={styles.footer}>
        <div style={styles.container}>
          {/* Main Footer Content */}
          <div style={styles.gridContainer}>
            {/* About Section */}
            <div>
              <div style={styles.logo}>
                <Folder size={32} color="#9333ea" />
                <span style={styles.logoText}>PhotoBooking</span>
              </div>
              <p style={styles.sectionText}>
                Nền tảng kết nối nhiếp ảnh gia và khách hàng hàng đầu tại Việt Nam. 
                Tìm kiếm và đặt lịch với các nhiếp ảnh gia tài năng một cách dễ dàng.
              </p>
              <div style={styles.socialLinks}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon} className="social-icon">
                  <Facebook size={20} color="#ffffff" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon} className="social-icon">
                  <Instagram size={20} color="#ffffff" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon} className="social-icon">
                  <Twitter size={20} color="#ffffff" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon} className="social-icon">
                  <Youtube size={20} color="#ffffff" />
                </a>
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h3 style={styles.sectionTitle}>Dành cho khách hàng</h3>
              <ul style={styles.linkList}>
                <li style={styles.linkItem}>
                  <Link to="/photographers" style={styles.link} className="footer-link">
                    Tìm nhiếp ảnh gia
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/packages" style={styles.link} className="footer-link">
                    Gói chụp ảnh
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/how-to-book" style={styles.link} className="footer-link">
                    Cách đặt lịch
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/refund-policy" style={styles.link} className="footer-link">
                    Chính sách hoàn tiền
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/faq" style={styles.link} className="footer-link">
                    Câu hỏi thường gặp
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Photographers */}
            <div>
              <h3 style={styles.sectionTitle}>Dành cho Photographer</h3>
              <ul style={styles.linkList}>
                <li style={styles.linkItem}>
                  <Link to="/register-photographer" style={styles.link} className="footer-link">
                    Đăng ký bán hàng
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/photographer-guide" style={styles.link} className="footer-link">
                    Hướng dẫn sử dụng
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/commission" style={styles.link} className="footer-link">
                    Chính sách hoa hồng
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/photographer-community" style={styles.link} className="footer-link">
                    Cộng đồng Photographer
                  </Link>
                </li>
                <li style={styles.linkItem}>
                  <Link to="/success-stories" style={styles.link} className="footer-link">
                    Câu chuyện thành công
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 style={styles.sectionTitle}>Liên hệ</h3>
              <div style={styles.contactItem}>
                <Mail size={18} color="#9333ea" style={{flexShrink: 0}} />
                <a href="mailto:support@photobooking.vn" style={{...styles.link, color: 'rgba(255, 255, 255, 0.7)'}} className="footer-link">
                  support@photobooking.vn
                </a>
              </div>
              <div style={styles.contactItem}>
                <Phone size={18} color="#9333ea" style={{flexShrink: 0}} />
                <a href="tel:1900xxxx" style={{...styles.link, color: 'rgba(255, 255, 255, 0.7)'}} className="footer-link">
                  1900 xxxx
                </a>
              </div>
              <div style={styles.contactItem}>
                <MapPin size={18} color="#9333ea" style={{flexShrink: 0}} />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div style={styles.contactItem}>
                <Phone size={18} color="#9333ea" style={{flexShrink: 0}} />
                <span>Hotline: 0123 456 789<br/>(8:00 - 22:00 hàng ngày)</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={styles.divider}></div>

          {/* Bottom Section */}
          <div style={styles.bottomSection} className="footer-bottom">
            <div style={styles.copyright}>
              &copy; 2024 PhotoBooking Platform. All rights reserved.
            </div>
            <div style={styles.bottomLinks} className="footer-bottom-links">
              <Link to="/terms" style={styles.link} className="footer-link">
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" style={styles.link} className="footer-link">
                Chính sách bảo mật
              </Link>
              <Link to="/cookie-policy" style={styles.link} className="footer-link">
                Chính sách Cookie
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}