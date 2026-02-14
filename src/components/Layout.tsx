import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Icon from "@/components/ui/icon";

const navItems = [
  { path: "/", icon: "Home", label: "Лента" },
  { path: "/search", icon: "Search", label: "Поиск", auth: true },
  { path: "/create", icon: "PlusSquare", label: "Создать", auth: true },
  { path: "/notifications", icon: "Bell", label: "Уведомления", auth: true },
  { path: "/messages", icon: "MessageCircle", label: "Сообщения", auth: true },
  { path: "/profile", icon: "User", label: "Профиль", auth: true },
];

const adminItems = [
  { path: "/admin/reports", icon: "Flag", label: "Жалобы" },
  { path: "/admin/verifications", icon: "BadgeCheck", label: "Верификация" },
  { path: "/admin/appeals", icon: "ShieldAlert", label: "Апелляции" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = user
    ? user.is_admin
      ? [...navItems, ...adminItems]
      : navItems
    : navItems.filter((i) => !i.auth);

  const isActive = (p: string) => p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex flex-col w-64 p-4 border-r border-border fixed h-full bg-card">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-primary-foreground bg-primary">B</div>
          <span className="text-xl font-bold">Buzzzy</span>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path === "/profile" && user ? `/profile/${user.username}` : item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive(item.path) ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        {user ? (
          <div className="space-y-2">
            <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary transition-all">
              <Icon name="Settings" size={20} />
              <span className="text-sm">Настройки</span>
            </button>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary transition-all">
              <Icon name="LogOut" size={20} />
              <span className="text-sm">Выйти</span>
            </button>
          </div>
        ) : (
          <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-xl font-medium bg-primary text-primary-foreground">
            Войти
          </button>
        )}
      </aside>

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border z-50 bg-card/95 backdrop-blur-md">
        {(user ? navItems.slice(0, 5) : [navItems[0]]).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path === "/profile" && user ? `/profile/${user.username}` : item.path)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
        {user && (
          <button
            onClick={() => navigate(`/profile/${user.username}`)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${
              location.pathname.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon name="User" size={20} />
            <span className="text-[10px]">Профиль</span>
          </button>
        )}
        {!user && (
          <button onClick={() => navigate("/login")} className="flex-1 flex flex-col items-center py-2 gap-0.5 text-primary">
            <Icon name="LogIn" size={20} />
            <span className="text-[10px]">Войти</span>
          </button>
        )}
      </nav>
    </div>
  );
}
