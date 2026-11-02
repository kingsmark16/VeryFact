import { useTranslation } from "react-i18next";
import "@/lib/i18n";
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <span className="font-semibold text-foreground">VeryFact.</span>
      <p>{t("footer")}</p>
    </footer>
  );
}
