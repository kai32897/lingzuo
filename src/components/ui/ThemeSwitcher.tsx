import { THEMES, useTheme, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({
  compact = false,
  onPick,
}: {
  compact?: boolean;
  onPick?: (theme: ThemeId) => void;
}) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn("theme-switcher", compact && "theme-switcher--compact")} role="group" aria-label="网站风格">
      {THEMES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn("theme-option", theme === item.id && "is-active")}
          aria-pressed={theme === item.id}
          onClick={() => {
            setTheme(item.id);
            onPick?.(item.id);
          }}
        >
          <span className="theme-option__swatches" aria-hidden="true">
            {item.colors.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </span>
          <span className="theme-option__copy">
            <strong>{item.label}</strong>
            {!compact ? <small>{item.desc}</small> : null}
          </span>
        </button>
      ))}
    </div>
  );
}
