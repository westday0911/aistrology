import ChartDisplay from "@/components/ChartDisplay";
import { Sparkles } from "lucide-react";
import Footer from "@/components/Footer";

export default function ChartPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center p-6 md:p-12 overflow-x-hidden overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="star-field" />
      <div className="absolute top-0 left-0 w-full h-full cosmic-gradient -z-10" />
      
      {/* Header */}
      <div className="w-full max-w-5xl mb-12 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter">
          AI<span className="text-purple-500">STROLOGY</span>
        </h1>
      </div>

      <ChartDisplay />

      <Footer className="mt-20 pb-12" />
    </main>
  );
}
