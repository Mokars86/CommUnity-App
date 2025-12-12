import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as d3 from 'd3'; 
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Import SDK
import { ViewState, PostCategory, Post, User, ChatPreview } from './types';
import Navigation from './components/Navigation';
import { Icons } from './components/Icons';
import { generatePostEnhancement, analyzeCommunityTrends, searchMapPlaces } from './services/geminiService';

// --- MOCK DATA ---
const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  avatar: 'https://picsum.photos/100/100',
  location: 'Greenwood District',
  reputation: 450,
  isVerified: true
};

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: { id: 'u2', name: 'Sarah Connor', avatar: 'https://picsum.photos/101/100', location: 'Greenwood', reputation: 320, isVerified: false },
    category: PostCategory.HELP,
    content: 'Can anyone recommend a good plumber who is available on weekends? My kitchen sink is leaking badly!',
    likes: 5,
    comments: 8,
    timestamp: '2h ago'
  },
  {
    id: 'p2',
    author: { id: 'u3', name: 'Mike Ross', avatar: 'https://picsum.photos/102/100', location: 'Greenwood', reputation: 550, isVerified: true },
    category: PostCategory.SAFETY,
    content: 'Suspicious activity reported near the park entrance. Please stay alert and keep gates locked.',
    alertLevel: 'warning',
    likes: 42,
    comments: 12,
    timestamp: '5h ago'
  },
  {
    id: 'p3',
    author: { id: 'u4', name: 'Emily Clark', avatar: 'https://picsum.photos/103/100', location: 'Greenwood', reputation: 120, isVerified: false },
    category: PostCategory.MARKETPLACE,
    content: 'Selling a vintage bicycle. Good condition, just needs new tires. $50 obo.',
    image: 'https://picsum.photos/400/250',
    likes: 10,
    comments: 2,
    timestamp: '1d ago'
  }
];

// --- SUB-COMPONENTS ---

const Header = ({ title, onBack, rightAction }: { title: string, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between transition-colors duration-300">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
          <Icons.ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h1>
    </div>
    <div className="flex items-center gap-3">
      {rightAction}
      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative">
        <Icons.Bell size={20} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
    </div>
  </div>
);

// --- VIEWS ---

const SplashView = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-full bg-teal-400 dark:bg-teal-600 flex flex-col items-center justify-center text-white p-6 transition-colors duration-300">
      <div className="mb-6 animate-bounce">
        <Icons.Home size={64} strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-bold mb-2">CommUnity</h1>
      <p className="text-teal-100 text-center">Connecting Communities, Empowering People</p>
    </div>
  );
};

const OnboardingView = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "Share Ideas & Communicate", desc: "Connect with neighbors instantly.", icon: Icons.MessageSquare },
    { title: "Support Each Other", desc: "Lend a hand or ask for help easily.", icon: Icons.Help },
    { title: "Build Stronger Communities", desc: "Join events and make your area safer.", icon: Icons.User },
  ];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 p-6 justify-between pt-20 pb-10 transition-colors duration-300">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="w-64 h-64 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-8">
           {React.createElement(slides[step].icon, { size: 80, className: "text-teal-500 dark:text-teal-400" })}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{slides[step].title}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">{slides[step].desc}</p>
        
        <div className="flex gap-2 mt-4">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-teal-500' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
      </div>

      <div className="w-full space-y-3">
        <button 
          onClick={() => step < 2 ? setStep(step + 1) : onFinish()}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-semibold transition-colors shadow-lg shadow-teal-200 dark:shadow-none"
        >
          {step === 2 ? "Get Started" : "Next"}
        </button>
        {step < 2 && (
          <button onClick={onFinish} className="w-full py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium">
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

const AuthView = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="h-screen bg-white dark:bg-gray-900 p-6 flex flex-col justify-center transition-colors duration-300">
      <div className="mb-10 text-center">
         <h2 className="text-3xl font-bold text-teal-900 dark:text-teal-400 mb-2">{isLogin ? 'Welcome Back' : 'Join Your Community'}</h2>
         <p className="text-gray-500 dark:text-gray-400">Enter your details to continue</p>
      </div>

      <div className="space-y-4">
        {!isLogin && (
          <div className="relative">
             <Icons.User className="absolute left-4 top-3.5 text-gray-400" size={20} />
             <input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors" />
          </div>
        )}
        <div className="relative">
          <Icons.Menu className="absolute left-4 top-3.5 text-gray-400" size={20} />
           <input type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        <div className="relative">
           <Icons.Settings className="absolute left-4 top-3.5 text-gray-400" size={20} />
           <input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        
        {!isLogin && (
          <div className="flex items-center gap-2 p-2">
            <input type="checkbox" id="terms" className="accent-teal-500 w-4 h-4" />
            <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400">I agree to the Terms & Privacy Policy</label>
          </div>
        )}

        <button onClick={onLogin} className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 shadow-md shadow-teal-100 dark:shadow-none transition-transform active:scale-95">
          {isLogin ? 'Log In' : 'Create Account'}
        </button>

        <div className="text-center my-4 text-gray-400 text-sm">OR</div>

        <button className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- CORE APP SCREENS ---

const HomeView = ({ posts, setView }: { posts: Post[], setView: (v: ViewState) => void }) => {
  const [activeTab, setActiveTab] = useState<PostCategory>(PostCategory.ALL);
  const tabs = Object.values(PostCategory);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-300">
      <Header 
        title="Greenwood District" 
        rightAction={<button onClick={() => setView(ViewState.ADMIN)}><Icons.Admin size={20} className="text-gray-500 dark:text-gray-400" /></button>}
      />

      {/* Categories */}
      <div className="sticky top-14 bg-white dark:bg-gray-900 z-30 py-3 px-4 shadow-sm dark:shadow-gray-800 overflow-x-auto no-scrollbar flex gap-2 transition-colors duration-300">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab 
              ? 'bg-teal-500 text-white shadow-md shadow-teal-100 dark:shadow-none' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {posts.filter(p => activeTab === PostCategory.ALL || p.category === activeTab).map(post => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <img src={post.author.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{post.author.name}</h3>
                    {post.author.isVerified && <Icons.Check size={14} className="text-teal-500 fill-current" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{post.author.location}</span>
                    <span>•</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.More size={20} /></button>
            </div>

            {/* Category Tag */}
            <div className="mb-2">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                ${post.category === PostCategory.SAFETY ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                  post.category === PostCategory.HELP ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                  'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                }`}>
                {post.category}
              </span>
            </div>

            {/* Content */}
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-3">{post.content}</p>
            {post.image && (
              <img src={post.image} alt="Post content" className="w-full h-48 object-cover rounded-xl mb-3" />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
              <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-red-500 transition-colors">
                <Icons.Heart size={18} /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-teal-500 transition-colors">
                <Icons.Comment size={18} /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-blue-500 transition-colors">
                <Icons.Share size={18} /> Share
              </button>
            </div>
          </div>
        ))}
        {/* Helper to fill space if few posts */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

const CreatePostView = ({ onBack, onSubmit }: { onBack: () => void, onSubmit: (post: Post) => void }) => {
  const [draft, setDraft] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedType, setSelectedType] = useState<PostCategory | null>(null);

  const handleEnhance = async () => {
    if (!draft) return;
    setIsEnhancing(true);
    const enhanced = await generatePostEnhancement(draft, selectedType || 'General');
    setDraft(enhanced);
    setIsEnhancing(false);
  };

  const handlePost = () => {
    if (!selectedType || !draft) return;
    
    const newPost: Post = {
        id: `p${Date.now()}`,
        author: CURRENT_USER,
        category: selectedType,
        content: draft,
        likes: 0,
        comments: 0,
        timestamp: 'Just now',
        alertLevel: selectedType === PostCategory.SAFETY ? 'warning' : undefined
    };
    
    onSubmit(newPost);
  };

  const options = [
    { label: 'Help Request', icon: Icons.Help, color: 'bg-amber-100 text-amber-600', type: PostCategory.HELP },
    { label: 'Idea', icon: Icons.Idea, color: 'bg-blue-100 text-blue-600', type: PostCategory.IDEAS },
    { label: 'Event', icon: Icons.Event, color: 'bg-purple-100 text-purple-600', type: PostCategory.EVENTS },
    { label: 'Marketplace', icon: Icons.Market, color: 'bg-green-100 text-green-600', type: PostCategory.MARKETPLACE },
    { label: 'Safety Alert', icon: Icons.Safety, color: 'bg-red-100 text-red-600', type: PostCategory.SAFETY },
    { label: 'General', icon: Icons.MessageCircle, color: 'bg-gray-100 text-gray-600', type: PostCategory.ALL },
  ];

  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col transition-colors duration-300">
        <Header title="Create New Post" onBack={onBack} />
        <div className="p-6 grid grid-cols-2 gap-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedType(opt.type)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all ${opt.color.replace('text-', 'hover:bg-opacity-80 bg-opacity-40')}`}
            >
              <div className={`p-4 rounded-full mb-3 ${opt.color}`}>
                <opt.icon size={28} />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col transition-colors duration-300">
       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setSelectedType(null)} className="text-gray-500 dark:text-gray-400"><Icons.ArrowLeft /></button>
          <span className="font-semibold text-gray-900 dark:text-white">{selectedType} Post</span>
          <button onClick={handlePost} className="text-teal-600 dark:text-teal-400 font-bold text-sm">Post</button>
       </div>
       <div className="p-4 flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-48 p-4 text-lg bg-transparent text-gray-900 dark:text-white border-none resize-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600"
          />
          
          <div className="flex gap-2 mb-4 overflow-x-auto">
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700">
               <Icons.Camera size={16} /> Photo
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700">
               <Icons.Pin size={16} /> Location
             </button>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <Icons.Lightbulb size={16} /> AI Assistant
              </h4>
              <button 
                onClick={handleEnhance}
                disabled={isEnhancing || !draft}
                className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {isEnhancing ? 'Thinking...' : 'Refine Text'}
              </button>
            </div>
            <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed">
              Use Gemini AI to polish your post, fix grammar, or make it friendlier for the community.
            </p>
          </div>
       </div>
    </div>
  );
};

const MapView = () => {
  const [query, setQuery] = useState('');
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{text: string, chunks: any[]} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Geolocation error or denied", err)
      );
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchResults(null);
    const result = await searchMapPlaces(query, userLoc || undefined);
    setSearchResults(result);
    setIsSearching(false);
  };

  return (
    <div className="h-full w-full bg-gray-200 dark:bg-gray-800 relative flex flex-col transition-colors duration-300">
      <div className="absolute top-4 left-4 right-4 z-20">
        <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg flex items-center gap-2 border border-transparent dark:border-gray-700">
          <Icons.Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find places, events, or addresses..." 
            className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400" 
          />
          {isSearching && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>}
          {searchResults && <button type="button" onClick={() => {setSearchResults(null); setQuery('')}}><Icons.Close size={18} className="text-gray-400"/></button>}
        </form>

        {/* Search Results Overlay */}
        {searchResults && (
          <div className="mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
              <Icons.Map size={16} className="text-teal-600 dark:text-teal-400"/> Results for "{query}"
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              {searchResults.text}
            </p>
            
            {searchResults.chunks.length > 0 && (
               <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Locations found</h4>
                  {searchResults.chunks.map((chunk, idx) => {
                      const uri = chunk.web?.uri || chunk.mobile?.uri || chunk.maps?.uri;
                      const title = chunk.web?.title || chunk.mobile?.title || chunk.maps?.title || "View on Map";
                      if (!uri) return null;
                      return (
                        <a 
                          key={idx} 
                          href={uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors group"
                        >
                          <span className="text-sm font-medium text-teal-800 dark:text-teal-300 truncate">{title}</span>
                          <Icons.Link size={14} className="text-teal-500 group-hover:text-teal-700 dark:group-hover:text-teal-300"/>
                        </a>
                      )
                  })}
               </div>
            )}
          </div>
        )}
      </div>
      
      {/* Simulated Map */}
      <div className="flex-1 flex items-center justify-center bg-blue-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
        {/* Background Grid simulating map */}
        <svg width="100%" height="100%" className="opacity-20 dark:opacity-10">
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
           </pattern>
           <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Map Pins */}
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
             <Icons.Warning size={20} />
          </div>
          <span className="bg-white dark:bg-gray-800 dark:text-white px-2 py-1 rounded shadow text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Safety Alert</span>
        </div>
  
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-gray-800">
             <Icons.Home size={20} />
          </div>
          <span className="bg-white dark:bg-gray-800 dark:text-white px-2 py-1 rounded shadow text-xs font-bold mt-1">Community Center</span>
        </div>
  
         <div className="absolute bottom-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-gray-800">
             <Icons.Event size={16} />
          </div>
          <span className="bg-white dark:bg-gray-800 dark:text-white px-2 py-1 rounded shadow text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Park Event</span>
        </div>
      </div>
  
      {/* Map Controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2">
         <button 
            className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err) => alert("Could not get location")
                    )
                }
            }}
         >
            <Icons.Pin size={20} className={userLoc ? "text-teal-500" : "text-gray-600 dark:text-gray-300"} />
         </button>
         <button className="bg-teal-500 p-3 rounded-full shadow-lg hover:bg-teal-600 text-white"><Icons.Plus size={20} /></button>
      </div>
    </div>
  );
};

const ChatsView = ({ onSelectChat }: { onSelectChat: (chatId: string) => void }) => {
  const chats: ChatPreview[] = [
    { id: 'ai-assistant', name: 'CommUnity AI Assistant', lastMessage: 'How can I help you today?', timestamp: 'Now', unread: 0, avatar: 'https://placehold.co/100x100/26a69a/ffffff?text=AI', isAi: true },
    { id: 'c1', name: 'Neighborhood Watch', lastMessage: 'Did anyone see the red car?', timestamp: '2m', unread: 3, avatar: 'https://picsum.photos/50/50' },
    { id: 'c2', name: 'Gardening Club', lastMessage: 'Meeting this Sunday at 10?', timestamp: '1h', unread: 0, avatar: 'https://picsum.photos/51/50' },
    { id: 'c3', name: 'Mike Ross', lastMessage: 'Thanks for the recommendation!', timestamp: '1d', unread: 0, avatar: 'https://picsum.photos/52/50' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header title="Messages" rightAction={<Icons.Plus className="text-teal-600 dark:text-teal-400" />} />
      <div className="p-4 space-y-1">
         <div className="relative mb-4">
             <Icons.Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none text-gray-900 dark:text-white" placeholder="Search chats..." />
         </div>

         {chats.map(chat => (
           <div 
            key={chat.id} 
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors ${chat.isAi ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900' : ''}`}
           >
             <div className="relative">
               <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
               {chat.unread > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-900">{chat.unread}</div>}
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-1">
                 <h4 className={`font-semibold truncate ${chat.isAi ? 'text-teal-900 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                    {chat.name}
                    {chat.isAi && <Icons.Star size={12} className="inline ml-1 text-teal-500 fill-current"/>}
                 </h4>
                 <span className="text-xs text-gray-400">{chat.timestamp}</span>
               </div>
               <p className={`text-sm truncate ${chat.unread > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{chat.lastMessage}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

// --- CHAT DETAIL VIEW (With Gemini Streaming) ---

interface Message {
    id: string;
    sender: 'user' | 'other' | 'ai';
    text: string;
    timestamp: Date;
}

const ChatDetailView = ({ chatId, onBack }: { chatId: string, onBack: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [chatSession, setChatSession] = useState<any>(null); // Type 'Chat' ideally

    const isAi = chatId === 'ai-assistant';
    const chatName = isAi ? "CommUnity AI Assistant" : "Neighborhood Watch";

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Init Gemini Chat
    useEffect(() => {
        if (isAi) {
            const apiKey = process.env.API_KEY;
            if (apiKey) {
                const ai = new GoogleGenAI({ apiKey });
                const chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "You are a helpful and friendly community assistant for the CommUnity app. You help neighbors connect, find local info, and solve neighborhood problems. Keep answers concise and polite."
                    }
                });
                setChatSession(chat);
                // Initial greeting
                setMessages([{ id: 'init', sender: 'ai', text: "Hello! I'm here to help you with anything related to our community. What can I do for you?", timestamp: new Date() }]);
            } else {
                setMessages([{ id: 'err', sender: 'ai', text: "AI Service Unavailable (Missing Key)", timestamp: new Date() }]);
            }
        } else {
            // Mock messages for other chats
            setMessages([
                { id: '1', sender: 'other', text: "Did anyone see the red car?", timestamp: new Date(Date.now() - 100000) },
                { id: '2', sender: 'user', text: "No, when was this?", timestamp: new Date(Date.now() - 50000) },
                { id: '3', sender: 'other', text: "About 20 mins ago.", timestamp: new Date() },
            ]);
        }
    }, [isAi, chatId]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        if (isAi && chatSession) {
            setIsTyping(true);
            try {
                // Streaming Response
                const result = await chatSession.sendMessageStream({ message: userMsg.text });
                
                // Create a placeholder message for AI response
                const responseId = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id: responseId, sender: 'ai', text: "", timestamp: new Date() }]);

                let fullText = "";
                for await (const chunk of result) {
                     const c = chunk as GenerateContentResponse;
                     if (c.text) {
                         fullText += c.text;
                         setMessages(prev => prev.map(m => m.id === responseId ? { ...m, text: fullText } : m));
                     }
                }
            } catch (err) {
                console.error("Chat Error", err);
                setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: "Sorry, I'm having trouble connecting right now.", timestamp: new Date() }]);
            } finally {
                setIsTyping(false);
            }
        } else if (!isAi) {
            // Mock reply
            setTimeout(() => {
                 setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'other', text: "Got it, thanks!", timestamp: new Date() }]);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
                <button onClick={onBack} className="text-gray-600 dark:text-gray-300"><Icons.ArrowLeft /></button>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={isAi ? "https://placehold.co/100x100/26a69a/ffffff?text=AI" : "https://picsum.photos/50/50"} 
                            className="w-10 h-10 rounded-full object-cover" 
                            alt="Avatar"
                        />
                        {isAi && <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"></div>}
                    </div>
                    <div>
                         <h3 className="font-bold text-gray-900 dark:text-white text-sm">{chatName}</h3>
                         <span className="text-xs text-gray-500 dark:text-gray-400">{isAi ? (isTyping ? "Typing..." : "Online") : "Active 5m ago"}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-teal-500 text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && messages[messages.length-1]?.sender === 'user' && (
                     <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 p-3 rounded-2xl rounded-bl-none text-xs border border-gray-100 dark:border-gray-700">
                           Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                    <input 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 text-gray-900 dark:text-white"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-2 rounded-full transition-colors ${input.trim() ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                    >
                        <Icons.ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProfileView = ({ isDarkMode, toggleTheme, onLogout }: { isDarkMode: boolean, toggleTheme: () => void, onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors duration-300">
    {/* Cover & Header */}
    <div className="bg-teal-600 h-48 relative">
       {/* Settings & Theme Toggle overlay on cover */}
       <div className="absolute top-4 right-4 flex gap-3">
         <button 
           onClick={toggleTheme} 
           className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
         >
            {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
         </button>
         <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
            <Icons.Settings size={20} />
         </button>
       </div>
    </div>

    <div className="px-4 relative -mt-16 mb-6">
       {/* Enhanced Profile Card */}
       <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
           <div className="flex justify-between items-start">
              <img src={CURRENT_USER.avatar} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover -mt-10" />
              <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Edit Profile
              </button>
           </div>
           
           <div className="mt-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 {CURRENT_USER.name}
                 {CURRENT_USER.isVerified && <Icons.Check size={18} className="text-teal-500 fill-current" />}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{CURRENT_USER.location}</p>
           </div>

           {/* Stats Row */}
           <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                 <span className="block font-bold text-lg text-gray-900 dark:text-white">{CURRENT_USER.reputation}</span>
                 <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Rep</span>
              </div>
              <div>
                 <span className="block font-bold text-lg text-gray-900 dark:text-white">12</span>
                 <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Posts</span>
              </div>
              <div>
                 <span className="block font-bold text-lg text-gray-900 dark:text-white">48</span>
                 <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Helped</span>
              </div>
           </div>
       </div>
    </div>

    {/* Content Sections */}
    <div className="px-4 space-y-4">
      
      {/* Bio */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="font-bold text-gray-800 dark:text-white mb-2">Bio</h3>
         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
           Local community enthusiast. Love gardening and organizing weekend cleanups. Always happy to lend tools!
         </p>
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="font-bold text-gray-800 dark:text-white mb-2">Skills Offered</h3>
         <div className="flex flex-wrap gap-2">
            {['Gardening', 'Tool Repair', 'Pet Sitting'].map(skill => (
              <span key={skill} className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-100 dark:border-purple-800">
                {skill}
              </span>
            ))}
         </div>
      </div>

      {/* Settings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
           <span className="text-gray-700 dark:text-gray-200 font-medium">Notifications</span>
           <Icons.ArrowRight size={16} className="text-gray-400"/>
        </div>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
           <span className="text-gray-700 dark:text-gray-200 font-medium">Privacy & Security</span>
           <Icons.ArrowRight size={16} className="text-gray-400"/>
        </div>
        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={toggleTheme}>
           <span className="text-gray-700 dark:text-gray-200 font-medium">Dark Mode</span>
           <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-teal-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'left-5.5' : 'left-0.5'}`}></div>
           </div>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 p-4 rounded-xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold mt-6 transition-colors"
      >
         <Icons.Logout size={20} /> Log Out
      </button>

      <div className="text-center text-xs text-gray-400 mt-4 pb-4">
        Version 1.2.0 • Build 482
      </div>
    </div>
  </div>
);

const AdminView = ({ onBack }: { onBack: () => void }) => {
    // D3 Visualization for Member Analytics
    const d3Container = useRef(null);
    const [insight, setInsight] = useState("Analyzing data...");

    useEffect(() => {
        if (d3Container.current) {
            d3.select(d3Container.current).selectAll("*").remove();

            const data = [
                { day: 'Mon', active: 120 },
                { day: 'Tue', active: 150 },
                { day: 'Wed', active: 180 },
                { day: 'Thu', active: 170 },
                { day: 'Fri', active: 220 },
                { day: 'Sat', active: 300 },
                { day: 'Sun', active: 280 },
            ];

            const margin = { top: 20, right: 20, bottom: 30, left: 40 };
            const width = 300 - margin.left - margin.right;
            const height = 200 - margin.top - margin.bottom;

            const svg = d3.select(d3Container.current)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .range([0, width])
                .padding(0.2)
                .domain(data.map(d => d.day));

            const y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, 350]);

            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#6b7280");

            svg.append("g")
                .call(d3.axisLeft(y).ticks(5))
                .selectAll("text")
                .style("font-size", "10px")
                .style("fill", "#6b7280");

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.day) || 0)
                .attr("width", x.bandwidth())
                .attr("y", d => y(d.active))
                .attr("height", d => height - y(d.active))
                .attr("fill", "#26a69a")
                .attr("rx", 4);
        }

        // Simulate AI analysis
        analyzeCommunityTrends([
            "Concern about park safety at night",
            "Request for more weekend cleanup events",
            "High interest in summer block party",
            "Complaints about speeding on Main St"
        ]).then(setInsight);

    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
            <Header title="Admin Panel" onBack={onBack} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">New Members</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">+24 <span className="text-green-500 text-xs font-normal">this week</span></p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Pending Posts</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8 <span className="text-amber-500 text-xs font-normal">need review</span></p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Icons.Chart size={18} className="text-teal-600 dark:text-teal-400"/>
                        Weekly Activity
                    </h3>
                    <div ref={d3Container} className="flex justify-center"></div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                        <Icons.Lightbulb size={18} />
                        AI Community Insights
                    </h3>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed italic">
                        "{insight}"
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-gray-800 dark:text-white ml-1">Quick Actions</h3>
                     <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
                            <Icons.Safety className="text-red-500" size={20}/> Manage Safety Alerts
                        </span>
                        <Icons.ArrowRight size={16} className="text-gray-400"/>
                    </button>
                    <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
                            <Icons.MessageSquare className="text-blue-500" size={20}/> Review Reported Content
                        </span>
                        <Icons.ArrowRight size={16} className="text-gray-400"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.SPLASH);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleCreatePost = (newPost: Post) => {
      setPosts(prev => [newPost, ...prev]);
      setView(ViewState.HOME);
  };

  const handleSelectChat = (chatId: string) => {
      setActiveChatId(chatId);
      setView(ViewState.CHAT_DETAIL);
  };

  const handleLogout = () => {
    setView(ViewState.AUTH_LOGIN);
  };

  const renderView = () => {
    switch (view) {
      case ViewState.SPLASH:
        return <SplashView onComplete={() => setView(ViewState.ONBOARDING)} />;
      case ViewState.ONBOARDING:
        return <OnboardingView onFinish={() => setView(ViewState.AUTH_LOGIN)} />;
      case ViewState.AUTH_LOGIN:
      case ViewState.AUTH_SIGNUP:
        return <AuthView onLogin={() => setView(ViewState.HOME)} />;
      case ViewState.HOME:
        return <HomeView posts={posts} setView={setView} />;
      case ViewState.CREATE_POST:
        return <CreatePostView onSubmit={handleCreatePost} onBack={() => setView(ViewState.HOME)} />;
      case ViewState.MAP:
        return <MapView />;
      case ViewState.CHATS:
        return <ChatsView onSelectChat={handleSelectChat} />;
      case ViewState.CHAT_DETAIL:
        return activeChatId ? <ChatDetailView chatId={activeChatId} onBack={() => setView(ViewState.CHATS)} /> : <ChatsView onSelectChat={handleSelectChat} />;
      case ViewState.PROFILE:
        return <ProfileView isDarkMode={isDarkMode} toggleTheme={toggleTheme} onLogout={handleLogout} />;
      case ViewState.ADMIN:
        return <AdminView onBack={() => setView(ViewState.HOME)} />;
      default:
        return <HomeView posts={posts} setView={setView} />;
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen relative shadow-2xl overflow-hidden transition-colors duration-300">
        {renderView()}
        <Navigation currentView={view} setView={setView} />
      </div>
    </div>
  );
};

export default App;