import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export function Navbar() {
  const { t } = useTranslation();
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        {t("skip")}
      </a>
      <div className="site-nav">
        <Link to="/" className="brand" aria-label={t("home")}>
          <img src="/Icon.png" alt="" width="36" height="36" />
          <span>
            VeryFact<span className="text-primary">.</span>
          </span>
        </Link>
        <nav aria-label={t("mainNav")} className="flex items-center gap-6">
          <Link to="/#how-it-works" className="nav-link">
            {t("how")}
          </Link>
          <a
            href="https://github.com/kingsmark16/VeryFact"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            {t("github")}
          </a>
        </nav>
      </div>
    </header>
  );
}
