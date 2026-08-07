import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { Landing } from "./pages/Landing";
import { IntakeForm } from "./pages/IntakeForm";
import { Results } from "./pages/Results";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/form" element={<IntakeForm />} />
          <Route path="/results/:analysisId" element={<Results />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-[var(--border-subtle)] py-8 text-center text-xs text-[var(--text-muted)]">
        FounderPilot AI — an AI co-founder for startup growth. Built for early-stage founders.
      </footer>
    </div>
  );
}
