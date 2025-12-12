import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as d3 from 'd3'; // Imported for usage in Admin/Stats later
import { ViewState, PostCategory, Post, User, ChatPreview } from './types';
import Navigation from './components/Navigation';
import { Icons } from './components/Icons';
import { generatePostEnhancement, analyzeCommunityTrends } from './services/geminiService';

// --- MOCK DATA ---
const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  avatar: 'https://picsum.photos/100/100',
  location: 'Greenwood District',
  reputation: 450,
  isVerified: true
};

const MOCK_POSTS: Post[] = [
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

// --- SUB-COMPONENTS (Defined here for single-file structure requirement adherence where applicable, but organized cleanly) ---

const Header = ({ title, onBack, rightAction }: { title: string, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 h-14 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
          <Icons.ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </div>
    <div className="flex items-center gap-3">
      {rightAction}
      <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative">
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
    <div className="h-screen w-full bg-teal-400 flex flex-col items-center justify-center text-white p-6">
      <div className="mb-6 animate-bounce">
        <Icons.Home size={64} strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-bold mb-2">CommUnityLink</h1>
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
    <div className="h-screen flex flex-col bg-white p-6 justify-between pt-20 pb-10">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="w-64 h-64 bg-teal-50 rounded-full flex items-center justify-center mb-8">
           {React.createElement(slides[step].icon, { size: 80, className: "text-teal-500" })}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{slides[step].title}</h2>
        <p className="text-gray-500 max-w-xs">{slides[step].desc}</p>
        
        <div className="flex gap-2 mt-4">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-teal-500' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="w-full space-y-3">
        <button 
          onClick={() => step < 2 ? setStep(step + 1) : onFinish()}
          className="w-full py-4 bg-teal-500 text-white rounded-2xl font-semibold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200"
        >
          {step === 2 ? "Get Started" : "Next"}
        </button>
        {step < 2 && (
          <button onClick={onFinish} className="w-full py-3 text-gray-400 hover:text-gray-600 font-medium">
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
    <div className="h-screen bg-white p-6 flex flex-col justify-center">
      <div className="mb-10 text-center">
         <h2 className="text-3xl font-bold text-teal-900 mb-2">{isLogin ? 'Welcome Back' : 'Join Your Community'}</h2>
         <p className="text-gray-500">Enter your details to continue</p>
      </div>

      <div className="space-y-4">
        {!isLogin && (
          <div className="relative">
             <Icons.User className="absolute left-4 top-3.5 text-gray-400" size={20} />
             <input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors" />
          </div>
        )}
        <div className="relative">
          <Icons.Menu className="absolute left-4 top-3.5 text-gray-400" size={20} />
           <input type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        <div className="relative">
           <Icons.Settings className="absolute left-4 top-3.5 text-gray-400" size={20} />
           <input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        
        {!isLogin && (
          <div className="flex items-center gap-2 p-2">
            <input type="checkbox" id="terms" className="accent-teal-500 w-4 h-4" />
            <label htmlFor="terms" className="text-sm text-gray-500">I agree to the Terms & Privacy Policy</label>
          </div>
        )}

        <button onClick={onLogin} className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 shadow-md shadow-teal-100 transition-transform active:scale-95">
          {isLogin ? 'Log In' : 'Create Account'}
        </button>

        <div className="text-center my-4 text-gray-400 text-sm">OR</div>

        <button className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-teal-600 font-semibold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- CORE APP SCREENS ---

const HomeView = ({ setView }: { setView: (v: ViewState) => void }) => {
  const [activeTab, setActiveTab] = useState<PostCategory>(PostCategory.ALL);
  const tabs = Object.values(PostCategory);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header 
        title="Greenwood District" 
        rightAction={<button onClick={() => setView(ViewState.ADMIN)}><Icons.Admin size={20} className="text-gray-500" /></button>}
      />

      {/* Categories */}
      <div className="sticky top-14 bg-white z-30 py-3 px-4 shadow-sm overflow-x-auto no-scrollbar flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab 
              ? 'bg-teal-500 text-white shadow-md shadow-teal-100' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {MOCK_POSTS.filter(p => activeTab === PostCategory.ALL || p.category === activeTab).map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <img src={post.author.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{post.author.name}</h3>
                    {post.author.isVerified && <Icons.Check size={14} className="text-teal-500 fill-current" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{post.author.location}</span>
                    <span>•</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600"><Icons.More size={20} /></button>
            </div>

            {/* Category Tag */}
            <div className="mb-2">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                ${post.category === PostCategory.SAFETY ? 'bg-red-100 text-red-600' : 
                  post.category === PostCategory.HELP ? 'bg-amber-100 text-amber-600' :
                  'bg-teal-50 text-teal-600'
                }`}>
                {post.category}
              </span>
            </div>

            {/* Content */}
            <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>
            {post.image && (
              <img src={post.image} alt="Post content" className="w-full h-48 object-cover rounded-xl mb-3" />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <button className="flex items-center gap-1.5 text-gray-500 text-xs font-medium hover:text-red-500 transition-colors">
                <Icons.Heart size={18} /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 text-xs font-medium hover:text-teal-500 transition-colors">
                <Icons.Comment size={18} /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 text-xs font-medium hover:text-blue-500 transition-colors">
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

const CreatePostView = ({ onBack }: { onBack: () => void }) => {
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
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <Header title="Create New Post" onBack={onBack} />
        <div className="p-6 grid grid-cols-2 gap-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedType(opt.type)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${opt.color.replace('text-', 'hover:bg-opacity-80 bg-opacity-40')}`}
            >
              <div className={`p-4 rounded-full mb-3 ${opt.color}`}>
                <opt.icon size={28} />
              </div>
              <span className="font-semibold text-gray-800 text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => setSelectedType(null)} className="text-gray-500"><Icons.ArrowLeft /></button>
          <span className="font-semibold">{selectedType} Post</span>
          <button onClick={onBack} className="text-teal-600 font-bold text-sm">Post</button>
       </div>
       <div className="p-4 flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-48 p-4 text-lg border-none resize-none focus:ring-0 placeholder-gray-300"
          />
          
          <div className="flex gap-2 mb-4 overflow-x-auto">
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-gray-600 text-sm font-medium border border-gray-200">
               <Icons.Camera size={16} /> Photo
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-gray-600 text-sm font-medium border border-gray-200">
               <Icons.Pin size={16} /> Location
             </button>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-teal-800 flex items-center gap-2">
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
            <p className="text-xs text-teal-700 leading-relaxed">
              Use Gemini AI to polish your post, fix grammar, or make it friendlier for the community.
            </p>
          </div>
       </div>
    </div>
  );
};

const MapView = () => (
  <div className="h-full w-full bg-gray-200 relative flex flex-col">
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="bg-white p-3 rounded-xl shadow-lg flex items-center gap-2">
        <Icons.Search className="text-gray-400" size={20} />
        <input type="text" placeholder="Search events, places..." className="flex-1 outline-none text-sm" />
      </div>
    </div>
    
    {/* Simulated Map */}
    <div className="flex-1 flex items-center justify-center bg-blue-50 overflow-hidden relative">
      {/* Background Grid simulating map */}
      <svg width="100%" height="100%" className="opacity-20">
         <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
         </pattern>
         <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Map Pins */}
      <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
           <Icons.Warning size={20} />
        </div>
        <span className="bg-white px-2 py-1 rounded shadow text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Safety Alert</span>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
        <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
           <Icons.Home size={20} />
        </div>
        <span className="bg-white px-2 py-1 rounded shadow text-xs font-bold mt-1">Community Center</span>
      </div>

       <div className="absolute bottom-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
           <Icons.Event size={16} />
        </div>
        <span className="bg-white px-2 py-1 rounded shadow text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Park Event</span>
      </div>
    </div>

    {/* Map Controls */}
    <div className="absolute bottom-24 right-4 flex flex-col gap-2">
       <button className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50"><Icons.Pin size={20} className="text-gray-600" /></button>
       <button className="bg-teal-500 p-3 rounded-full shadow-lg hover:bg-teal-600 text-white"><Icons.Plus size={20} /></button>
    </div>
  </div>
);

const ChatsView = () => {
  const chats: ChatPreview[] = [
    { id: 'c1', name: 'Neighborhood Watch', lastMessage: 'Did anyone see the red car?', timestamp: '2m', unread: 3, avatar: 'https://picsum.photos/50/50' },
    { id: 'c2', name: 'Gardening Club', lastMessage: 'Meeting this Sunday at 10?', timestamp: '1h', unread: 0, avatar: 'https://picsum.photos/51/50' },
    { id: 'c3', name: 'Mike Ross', lastMessage: 'Thanks for the recommendation!', timestamp: '1d', unread: 0, avatar: 'https://picsum.photos/52/50' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <Header title="Messages" rightAction={<Icons.Plus className="text-teal-600" />} />
      <div className="p-4 space-y-1">
         <div className="relative mb-4">
             <Icons.Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none" placeholder="Search chats..." />
         </div>

         {chats.map(chat => (
           <div key={chat.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
             <div className="relative">
               <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
               {chat.unread > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white">{chat.unread}</div>}
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-1">
                 <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
                 <span className="text-xs text-gray-400">{chat.timestamp}</span>
               </div>
               <p className={`text-sm truncate ${chat.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>{chat.lastMessage}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

const ProfileView = () => (
  <div className="min-h-screen bg-gray-50 pb-24">
    {/* Cover & Header */}
    <div className="bg-teal-600 h-40 relative">
       <button className="absolute top-4 right-4 text-white/80 hover:text-white"><Icons.Settings /></button>
    </div>
    <div className="px-4 -mt-12 mb-4 flex justify-between items-end">
       <img src={CURRENT_USER.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white object-cover" />
       <button className="mb-2 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium bg-white hover:bg-gray-50">Edit Profile</button>
    </div>
    
    <div className="px-4 mb-6">
       <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
         {CURRENT_USER.name}
         {CURRENT_USER.isVerified && <Icons.Check size={20} className="text-teal-500 fill-current" />}
       </h2>
       <p className="text-gray-500 text-sm mb-2">{CURRENT_USER.location}</p>
       <div className="flex gap-4 mt-3">
          <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
            <Icons.Star size={14} className="fill-current" /> {CURRENT_USER.reputation} Rep
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">Joined 2023</div>
       </div>
    </div>

    {/* Bio & Skills */}
    <div className="px-4 space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-800 mb-2">Bio</h3>
         <p className="text-sm text-gray-600 leading-relaxed">Local community enthusiast. Love gardening and organizing weekend cleanups. Always happy to lend tools!</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-800 mb-2">Skills Offered</h3>
         <div className="flex flex-wrap gap-2">
            {['Gardening', 'Tool Repair', 'Pet Sitting'].map(skill => (
              <span key={skill} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
            ))}
         </div>
      </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">My Activity</h3>
            <span className="text-teal-600 text-sm font-medium">View All</span>
         </div>
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Icons.Help size={20} /></div>
               <div>
                  <p className="text-sm font-medium text-gray-900">Requested Help</p>
                  <p className="text-xs text-gray-500">2 days ago • Resolved</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Icons.Idea size={20} /></div>
               <div>
                  <p className="text-sm font-medium text-gray-900">Shared an Idea</p>
                  <p className="text-xs text-gray-500">1 week ago • 15 likes</p>
               </div>
            </div>
         </div>
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
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header title="Admin Panel" onBack={onBack} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-xs uppercase font-bold tracking-wider">New Members</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">+24 <span className="text-green-500 text-xs font-normal">this week</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                         <h3 className="text-gray-500 text-xs uppercase font-bold tracking-wider">Pending Posts</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">8 <span className="text-amber-500 text-xs font-normal">need review</span></p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Icons.Chart size={18} className="text-teal-600"/>
                        Weekly Activity
                    </h3>
                    <div ref={d3Container} className="flex justify-center"></div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <Icons.Lightbulb size={18} />
                        AI Community Insights
                    </h3>
                    <p className="text-sm text-indigo-800 leading-relaxed italic">
                        "{insight}"
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-gray-800 ml-1">Quick Actions</h3>
                     <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50">
                        <span className="flex items-center gap-3 font-medium text-gray-700">
                            <Icons.Safety className="text-red-500" size={20}/> Manage Safety Alerts
                        </span>
                        <Icons.ArrowRight size={16} className="text-gray-400"/>
                    </button>
                    <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50">
                        <span className="flex items-center gap-3 font-medium text-gray-700">
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

  // Simple router logic
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
        return <HomeView setView={setView} />;
      case ViewState.CREATE_POST:
        return <CreatePostView onBack={() => setView(ViewState.HOME)} />;
      case ViewState.MAP:
        return <MapView />;
      case ViewState.CHATS:
        return <ChatsView />;
      case ViewState.PROFILE:
        return <ProfileView />;
      case ViewState.ADMIN:
        return <AdminView onBack={() => setView(ViewState.HOME)} />;
      default:
        return <HomeView setView={setView} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
      {renderView()}
      <Navigation currentView={view} setView={setView} />
    </div>
  );
};

export default App;