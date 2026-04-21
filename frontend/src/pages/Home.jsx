import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, CheckCircle2, Sparkles, LogIn, ChevronRight, MessageSquare, Calendar, Star, ChevronDown, Rocket } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const featureTabs = [
    { 
      id: 0, 
      icon: Calendar,
      title: "Smart Scheduling Core", 
      desc: "Instantly compare your free time slots against group members without manual texts.", 
      preview: "Analysis Output: Matching Sunday 2PM block found instantly." 
    },
    { 
      id: 1, 
      icon: MessageSquare,
      title: "Encrypted Direct Messaging", 
      desc: "Collaborate seamlessly without giving out your personal phone number or social media.", 
      preview: "Incoming secure message from Taylor: 'Are we still meeting in the library?'" 
    },
    { 
      id: 2, 
      icon: Rocket,
      title: "Complementary Skill Sync", 
      desc: "Automatically match complementary skills together. If you excel at math and they excel at theory, trade off review sessions.", 
      preview: "Competency Output: 94% Synergistic Match." 
    }
  ];

  const testimonials = [
    { name: "Sarah Jenkins", major: "Pre-Med", quote: "I was struggling with Anatomy 101. The AI paired me with two visual learners who made flashcards, and my test scores skyrocketed." },
    { name: "Marcus T.", major: "Computer Science", quote: "StudyMatch saved my Data Structures grade. Finding group members who actually had Thursday nights free was impossible before this." },
    { name: "Elena R.", major: "Business Finance", quote: "The psychological grouping is no joke. I'm an auditory learner, and our group discussions perfectly sync with my retention style." }
  ];

  const faqs = [
    { q: "Is the platform completely free?", a: "Yes, StudyMatch is 100% free for all valid university students to use." },
    { q: "How does the AI matchmaking actually work?", a: "The algorithm strictly mathematically weights 40% towards course overlap, 25% on identical calendar availability, and 35% on psychological learning synergies." },
    { q: "Is my calendar information secure?", a: "Absolutely. We only display binary overlapping free/busy blocks to other potential matched partners, not your personal event names." },
    { q: "Can I generate private groups?", a: "By default, groups are semi-public to encourage academic networking, but you can configure group access locks if you only want specific algorithm matches to join." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <main className="flex-1 flex flex-col overflow-x-hidden">
        
        {/* Dynamic Premium Hero Section */}
        <section className="relative px-6 pt-6 pb-20 lg:pb-24 bg-indigo-950 shadow-inner overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-indigo-600 opacity-20 blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-emerald-500 opacity-10 blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>
          
          <header className="relative z-20 max-w-7xl mx-auto w-full mb-12 lg:mb-16">
            <nav className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div className="relative group cursor-default">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                  <div className="relative bg-[#0f172a] p-2.5 rounded-xl border border-white/10 ring-1 ring-white/5 shadow-2xl">
                    <BookOpen className="h-6 w-6 text-indigo-300" />
                  </div>
                </div>
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-white animate-shimmer bg-[length:200%_auto] text-transparent bg-clip-text">
                  StudyMatch
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-indigo-200/80 text-sm font-bold">
                 <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                 <a href="#features" className="hover:text-white transition-colors">Features</a>
                 <a href="#wall-of-love" className="hover:text-white transition-colors">Reviews</a>
              </div>
            </nav>
          </header>

          <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10 items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
              <div className="text-left py-6">
                <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-800/50 border border-indigo-700/50 text-indigo-200 text-sm font-bold mb-8 shadow-sm backdrop-blur-md">
                  <Brain className="h-4 w-4" />
                  <span>Smart Matchmaking Algorithm Engine</span>
                </div>
                
                <h1 className="animate-fade-in-up text-5xl md:text-[4.2rem] font-extrabold text-white tracking-tight mb-8 leading-[1.05]">
                  Don't study alone. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-200 animate-shimmer">
                    Study highly optimized.
                  </span>
                </h1>
                
                <p className="animate-fade-in-delayed text-lg md:text-xl text-indigo-100/90 font-medium mb-12 leading-relaxed shadow-sm max-w-xl">
                  Welcome to the premier platform that networks university students into study groups based on academic majors, exact calendar availability, and core psychological learning styles.
                </p>
                
                <div className="animate-fade-in-super-delayed flex flex-col sm:flex-row items-center gap-5">
                  <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-indigo-900 font-extrabold text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] text-center relative overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center gap-2">Get Started Free <ChevronRight className="h-5 w-5" /></span>
                    <div className="absolute top-0 left-0 h-full w-[50px] bg-white/50 blur-[20px] -skew-x-[20deg] animate-laser"></div>
                  </Link>
                  
                  <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent text-white border-2 border-indigo-400/30 font-bold text-lg hover:bg-indigo-800/40 hover:border-indigo-300 transition-all hover:scale-105 text-center flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Link>
                </div>
              </div>

              <div className="hidden lg:block relative perspective-1000 animate-fade-in-delayed">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 rounded-3xl transform rotate-3 opacity-40 blur-2xl animate-pulse"></div>
                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-[0_0_80px_rgba(79,70,229,0.15)] transform -rotate-1 hover:rotate-0 transition-all duration-700 hover:scale-[1.02] group ring-1 ring-white/10">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                     <span className="text-white/80 font-bold text-sm tracking-widest uppercase">Live Match Preview</span>
                     <Sparkles className="h-4 w-4 text-amber-300" />
                   </div>
                   
                   <div className="bg-white p-6 rounded-2xl shadow-xl">
                     <div className="flex justify-between items-start mb-5">
                       <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                            <span className="text-indigo-600 font-black text-xl">TB</span>
                         </div>
                         <div>
                            <h4 className="font-extrabold text-slate-900 text-lg tracking-tight leading-none mb-1">Taylor Brooks</h4>
                            <p className="text-sm font-bold text-slate-500">Computer Science</p>
                         </div>
                       </div>
                       <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm uppercase tracking-wider relative overflow-hidden">
                         <span className="relative z-10">98% Match</span>
                         <div className="absolute top-0 left-0 h-full w-[20px] bg-white/80 blur-[5px] animate-laser"></div>
                       </span>
                     </div>
                     <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                       <p className="text-sm text-slate-600 font-medium leading-relaxed">Perfect overlap in Machine Learning with identical Visual learning styles and matching Sunday free slots.</p>
                     </div>
                   </div>
                   
                   <div className="bg-white/90 p-5 rounded-2xl shadow-lg mt-4 opacity-70 block transform translate-y-1 scale-[0.98]">
                      <h4 className="font-extrabold text-slate-900 tracking-tight mb-1">Advanced Algorithms Studio</h4>
                      <p className="text-xs font-bold text-slate-500">3 Members active</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The "Going In A Line" Infinite Marquee */}
        <div className="w-full overflow-hidden bg-indigo-950/80 border-t border-b border-indigo-900/50 py-5 relative z-30 flex whitespace-nowrap shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-indigo-950 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-950 to-transparent z-10 pointer-events-none"></div>
          <div className="flex animate-scroll min-w-max">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-16 px-8 items-center text-indigo-200/80 font-black tracking-[0.2em] uppercase text-xs">
                <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-emerald-400"/> Adaptive AI Matching</span>
                <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-emerald-400"/> Group Study Optimizations</span>
                <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-emerald-400"/> GPA Scaling Mathematics</span>
                <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-emerald-400"/> Real-time Calendar Sync</span>
              </div>
            ))}
          </div>
        </div>

        <section id="metrics" className="bg-indigo-900 py-12 border-b border-indigo-950 shadow-inner relative z-20">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-800/50">
              <div className="pt-4 md:pt-0">
                 <p className="text-4xl font-black text-white tracking-tight mb-2">50+</p>
                 <p className="text-xs font-black tracking-widest text-indigo-300 uppercase">Active Students</p>
              </div>
              <div className="pt-4 md:pt-0">
                 <p className="text-4xl font-black text-white tracking-tight mb-2">94%</p>
                 <p className="text-xs font-black tracking-widest text-indigo-300 uppercase">Avg. Compatibility</p>
              </div>
              <div className="pt-4 md:pt-0">
                 <p className="text-4xl font-black text-white tracking-tight mb-2">24/7</p>
                 <p className="text-xs font-black tracking-widest text-indigo-300 uppercase">Calculations Handled</p>
              </div>
           </div>
        </section>

        {/* Feature Interactive Tabs Viewer */}
        <section id="features" className="py-32 px-6 bg-white border-b border-slate-200">
           <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Everything you need to excel.</h2>
               <p className="text-xl text-slate-600 font-medium">Built-in mechanics to keep you strictly focused on the syllabus.</p>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
                  {featureTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-left p-6 rounded-2xl transition-all duration-300 border-2 ${isActive ? 'bg-indigo-50 border-indigo-600 shadow-md scale-[1.02]' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                      >
                         <div className="flex items-center gap-4 mb-2">
                           <div className={`p-2.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Icon className="h-5 w-5" />
                           </div>
                           <h3 className={`text-xl font-extrabold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{tab.title}</h3>
                         </div>
                         <p className={`text-sm ${isActive ? 'text-indigo-900/70 font-medium' : 'text-slate-500'}`}>{tab.desc}</p>
                      </button>
                    )
                  })}
                </div>
                
                <div className="col-span-1 lg:col-span-7 bg-slate-100 rounded-3xl p-8 border border-slate-200 h-[400px] flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/50 to-emerald-50/50"></div>
                   
                   <div className="animate-fade-in-up bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-slate-100" key={activeTab}>
                     <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                        <Sparkles className="h-6 w-6 text-amber-400" />
                        <h4 className="font-black text-slate-800 tracking-tight">System Simulation</h4>
                     </div>
                     <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl border-dashed">
                        <p className="font-mono text-sm text-indigo-600 font-bold">{featureTabs[activeTab].preview}</p>
                     </div>
                     <div className="mt-6 flex justify-end">
                       <div className="h-3 w-1/3 bg-slate-200 rounded-full"></div>
                     </div>
                   </div>
                </div>
             </div>
           </div>
        </section>

        {/* How It Works Timeline */}
        <section id="how-it-works" className="py-32 px-6 bg-slate-50 relative border-b border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">How Matchmaking Works</h2>
              <p className="text-xl text-slate-600 font-medium">Stop relying on random group assignments. Follow the AI logic.</p>
            </div>
            
            <div className="space-y-16 relative">
              <div className="hidden md:block absolute left-[3.25rem] top-8 bottom-8 w-1.5 bg-indigo-100 rounded-full z-0"></div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative z-10 group">
                <div className="shrink-0 flex items-center mb-4 md:mb-0 relative">
                  <div className="h-[6.5rem] w-[6.5rem] rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-indigo-600/30 border-[6px] border-slate-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">1</div>
                  <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-full transform group-hover:scale-150 transition-transform duration-500"></div>
                </div>
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group-hover:border-indigo-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150"></div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Input Your Parameters</h3>
                  <p className="text-slate-600 font-medium leading-relaxed text-lg relative z-10">
                    Set up your profile by selecting your exact enrolled courses, your specific time availability (e.g. Wednesday Evenings), and your learning style.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative z-10 group mt-16">
                <div className="shrink-0 flex items-center mb-4 md:mb-0 relative">
                  <div className="h-[6.5rem] w-[6.5rem] rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl border-[6px] border-slate-50 group-hover:scale-110 transition-transform duration-300">2</div>
                </div>
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1 hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">AI Weights the Variables</h3>
                  <p className="text-slate-600 font-medium leading-relaxed text-lg">
                    Our dynamic Python algorithm compares your parameters against thousands of combinations—weighting subjects at 40% and availability at 25%—to generate a ranked compatibility list.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative z-10 group mt-16">
                <div className="shrink-0 flex items-center mb-4 md:mb-0 relative">
                  <div className="h-[6.5rem] w-[6.5rem] rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl border-[6px] border-slate-50 group-hover:scale-110 transition-transform duration-300">3</div>
                </div>
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1 hover:shadow-lg transition-shadow">
                 <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Connect and Excel</h3>
                  <p className="text-slate-600 font-medium leading-relaxed text-lg">
                    Review your high-percentage matches and immediately join or construct a rigorous public study group together. Maximize your collaborative success seamlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wall of Love (Testimonials Grid) */}
        <section id="wall-of-love" className="py-32 px-6 bg-indigo-50 border-b border-indigo-100">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
               <span className="text-indigo-600 font-extrabold uppercase tracking-widest text-sm mb-2 block">Wall of Love</span>
               <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">You're in good company.</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-2 hover:border-indigo-200 transition-all duration-500 group relative">
                    <div className="absolute -top-3 -right-3 text-indigo-100 opacity-50 group-hover:opacity-100 transition-opacity">
                      <MessageSquare className="h-24 w-24 fill-current" />
                    </div>
                    <div className="flex gap-1 mb-6 relative z-10">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400 drop-shadow-sm" />)}
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed mb-8 italic relative z-10 group-hover:text-slate-900 transition-colors">"{t.quote}"</p>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center font-black text-indigo-600 border border-indigo-200 shadow-sm group-hover:scale-110 transition-transform">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{t.name}</h4>
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{t.major}</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-32 px-6 bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Platform FAQs</h2>
              <p className="text-xl text-slate-600 font-medium">Common questions about the matching architecture.</p>
            </div>
            
            <div className="space-y-4">
               {faqs.map((faq, idx) => {
                 const isOpen = openFaq === idx;
                 return (
                   <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}>
                     <button 
                       className="w-full flex items-center justify-between p-6 bg-white text-left"
                       onClick={() => setOpenFaq(isOpen ? null : idx)}
                     >
                        <span className={`font-extrabold text-lg ${isOpen ? 'text-indigo-600' : 'text-slate-800'}`}>{faq.q}</span>
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                     </button>
                     <div className={`px-6 bg-slate-50 text-slate-600 font-medium leading-relaxed overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 py-6 border-t border-slate-100' : 'max-h-0 py-0'}`}>
                        {faq.a}
                     </div>
                   </div>
                 )
               })}
            </div>
          </div>
        </section>

        {/* Massive Bottom CTA Banner */}
        <section className="py-24 px-6 bg-indigo-950 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500 opacity-20 blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500 opacity-20 blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

           <div className="max-w-4xl mx-auto text-center relative z-10">
             <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">Ready to optimize your semester?</h2>
             <p className="text-xl md:text-2xl text-indigo-200 mb-10 font-medium max-w-2xl mx-auto">Join thousands of students leveraging mathematics and psychology to accelerate their personal GPA.</p>
             <Link to="/register" className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-indigo-900 font-extrabold text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
               Get Started Free <ChevronRight className="h-6 w-6" />
             </Link>
           </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl border border-indigo-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">StudyMatch</span>
          </div>
          <p className="text-sm font-bold text-slate-500 max-w-sm text-center md:text-right leading-relaxed">
            An advanced adaptive platform dedicated to optimizing university outcomes logically.
          </p>
        </div>
      </footer>
    </div>
  );
}
