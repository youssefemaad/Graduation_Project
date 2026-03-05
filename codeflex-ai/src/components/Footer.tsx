import { Ticket } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
      {/* Top border glow */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-blue-500/20">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">
                Pulse<span className="text-primary">Gym</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} PulseGym - All rights reserved
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-2 text-sm">
            <Link
              href="/about"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/blog"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/help"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              Help
            </Link>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-slate-600">SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
