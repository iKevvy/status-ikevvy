import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Admin from "./pages/Admin";

function App() {
  const path = window.location.pathname;

  if (
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {
    return <Admin />;
  }

  if (path === "/contact" || path === "/contact/") {
    return <Contact />;
  }

  return <Home />;
}

export default App;
