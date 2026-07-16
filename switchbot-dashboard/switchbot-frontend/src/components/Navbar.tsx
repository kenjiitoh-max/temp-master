import { ThemeSwitcher } from "./ThemeSwitcher";

interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        Temp Master Dashboard
      </a>
      <div className="navbar-right">
        <ThemeSwitcher />
        <span
          className={`connection-status ${
            connected ? "connected" : "disconnected"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </nav>
  );
}
