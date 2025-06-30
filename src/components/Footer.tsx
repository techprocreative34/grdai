// src/components/Footer.tsx
export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-white py-4 mt-8">
      <div className="container mx-auto px-6 text-center text-sm text-gray-400">
        <p>© {currentYear} Garuda AI. Dibuat dengan semangat untuk Indonesia.</p>
      </div>
    </footer>
  );
}