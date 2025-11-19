import "./HeaderAdmin.css";

export default function HeaderAdmin() {
  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="header-title">Trang quản trị</h1>
      </div>

      <div className="header-right">
        <span className="material-icons notif-icon">notifications</span>

        <div className="header-user">
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="avatar"
            className="user-avatar"
          />

          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Quản trị viên</span>
          </div>
        </div>
      </div>

      {/* Material Icons */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </header>
  );
}
