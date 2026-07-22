import { createContext, useContext, useEffect, useState } from 'react';
const Ctx = createContext(null);
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('cusi_theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('cusi_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
