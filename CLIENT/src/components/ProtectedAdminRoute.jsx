export default function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    window.location.href = "/admin/login";
    return null;
  }

  return children;
}
