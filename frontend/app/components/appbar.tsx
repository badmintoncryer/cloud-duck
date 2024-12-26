import { useState, useEffect, useRef } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function AppBar() {
  const { user, signOut } = useAuthenticator();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-lg">
      <div className="flex items-center">
        <img src={'/logo_transparent.png'} alt="CloudDuck Logo" className="h-10 mr-2" /> {/* ロゴを追加 */}
        <div className="text-2xl font-bold tracking-wide">CloudDuck</div>
      </div>
      <div className="relative" ref={menuRef}>
        <button onClick={toggleMenu} className="text-lg font-semibold hover:text-gray-300 transition duration-300 underline">
          {user?.signInDetails?.loginId}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded-lg shadow-lg">
            <button
              onClick={signOut}
              className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-700 transition duration-300"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
