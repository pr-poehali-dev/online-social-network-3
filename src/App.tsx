import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";
import Layout from "@/components/Layout";
import Feed from "@/pages/Feed";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import PostDetail from "@/pages/PostDetail";
import Search from "@/pages/Search";
import CreatePost from "@/pages/CreatePost";
import Notifications from "@/pages/Notifications";
import Messages from "@/pages/Messages";
import Conversation from "@/pages/Conversation";
import Settings from "@/pages/Settings";
import FollowList from "@/pages/FollowList";
import AdminReports from "@/pages/AdminReports";
import AdminVerifications from "@/pages/AdminVerifications";
import AdminAppeals from "@/pages/AdminAppeals";

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout><Feed /></Layout>} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/create" element={<Layout><CreatePost /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/messages" element={<Layout><Messages /></Layout>} />
          <Route path="/messages/:partnerId" element={<Layout><Conversation /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:username" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:username/:type" element={<Layout><FollowList /></Layout>} />
          <Route path="/u/:username" element={<Layout><Profile /></Layout>} />
          <Route path="/u/:username/:type" element={<Layout><FollowList /></Layout>} />
          <Route path="/post/:id" element={<Layout><PostDetail /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/admin/reports" element={<Layout><AdminReports /></Layout>} />
          <Route path="/admin/verifications" element={<Layout><AdminVerifications /></Layout>} />
          <Route path="/admin/appeals" element={<Layout><AdminAppeals /></Layout>} />
          <Route path="*" element={<Layout><div className="p-12 text-center text-muted-foreground">404 — Страница не найдена</div></Layout>} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
