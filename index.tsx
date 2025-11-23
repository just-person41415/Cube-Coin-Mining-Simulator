
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Cpu, Zap, ShoppingCart, Wallet, Server, Terminal, DollarSign, Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, Rainbow, Wifi, WifiOff, Moon, Star, Wind, Snowflake, AlertTriangle, Home, Clock, Bed, LogOut, X, LoaderCircle, CheckCircle, Info, Flame, BookOpen, Mail, Lock, HelpCircle, Settings, Eye, Pickaxe, Gem, Binary, Sunset, FlaskConical, Database, Disc, Pyramid, Target } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// --- Firebase 설정 ---
const firebaseConfig = {
  apiKey: "AIzaSyDhjOecioHObzsMfgX0suEX1IRraMcj0hU",
  authDomain: "cube-coin-mining-simulator.firebaseapp.com",
  projectId: "cube-coin-mining-simulator",
  storageBucket: "cube-coin-mining-simulator.firebasestorage.app",
  messagingSenderId: "501436679250",
  appId: "1:501436679250:web:f8dd3a335bea4509b6cb8b",
  measurementId: "G-P35KELVNR0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 게임 상수 ---
const COIN_TYPES = {
  CUBE: { name: 'CUBE', value: 10000, color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/30', icon: Server, sellable: true },
  LUNAR: { name: 'LUNAR', value: 20000, color: 'text-gray-200', border: 'border-gray-300', bg: 'bg-gray-800/50', icon: Moon, sellable: true },
  ENERGY: { name: 'ENERGY', value: 50000, color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-900/30', icon: Zap, sellable: true },
  PRISM: { name: 'PRISM', value: 100000, color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/30', icon: Rainbow, sellable: true },
  DIGITAL: { name: 'DIGITAL', value: 200000, color: 'text-cyan-400', border: 'border-cyan-500', bg: 'bg-cyan-900/30', icon: Binary, sellable: true },
  AURORA: { name: 'AURORA', value: 500000, color: 'text-teal-300', border: 'border-teal-400', bg: 'bg-teal-900/30', icon: Sunset, sellable: true },
  MAGIC_STONE: { name: 'MAGIC_STONE', value: 0, color: 'text-pink-500', border: 'border-pink-500', bg: 'bg-pink-900/30', icon: Gem, sellable: false },
  DATA_CRYSTAL: { name: 'DATA_CRYSTAL', value: 0, color: 'text-emerald-300', border: 'border-emerald-400', bg: 'bg-emerald-900/30', icon: Database, sellable: false },
};

const COMPUTERS = [
  { id: 'tier1', name: '스타터 PC', tier: 1, cost: 75000, costType: 'MONEY', icon: Cpu, interval: 4000, desc: "CUBE, LUNAR 채굴" },
  { id: 'tier2', name: '게이머 PC', tier: 2, cost: 250000, costType: 'MONEY', icon: Server, interval: 4000, desc: "4종 코인 채굴" },
  { id: 'tier3', name: '채굴용 PC', tier: 3, cost: 700000, costType: 'MONEY', icon: Zap, interval: 4000, desc: "DIGITAL 포함 5종 채굴" },
  { id: 'tier4', name: '고급 채굴용 PC', tier: 4, cost: 10, costType: 'DATA_CRYSTAL', icon: CloudLightning, interval: 4000, desc: "고효율 채굴" },
  { id: 'tier5', name: '해킹 PC', tier: 5, cost: 40, costType: 'DATA_CRYSTAL', icon: Binary, interval: 4000, desc: "최고 효율 채굴" }
];

type Season = '봄' | '여름' | '가을' | '겨울';
type WeatherType = '맑음' | '구름' | '비' | '천둥' | '산성비' | '무지개' | '황사' | '폭염' | '폭우' | '눈' | '별똥별' | '유성우' | '우박' | '오로라' | '블루문';

const GENERAL_STORE_ITEMS = [
    { id: 'clock', name: '디지털 시계', cost: 10000, costType: 'MONEY', description: '시간과 날짜를 표시합니다.', icon: Clock, type: 'item' },
    { id: 'bed', name: '침대', cost: 50000, costType: 'MONEY', description: '21:00 이후 시간을 건너뜁니다.', icon: Bed, type: 'item' },
    { id: 'almanac', name: '날씨 도감', cost: 75000, costType: 'MONEY', description: '날씨 효과를 기록합니다.', icon: BookOpen, type: 'item' },
    { id: 'forecaster', name: '일기예보', cost: 120000, costType: 'MONEY', description: '다음 날씨를 60% 확률로 예보합니다.', icon: Eye, type: 'item' },
];

const TOTEMS: {
    id: string;
    name: string;
    seasons: Season[];
    time: 'day' | 'night' | 'any';
    cost: number;
    reward: { [key: string]: number };
    stockChance: number;
    description: string;
}[] = [
    // --- 계절별 토템 ---
    { id: 'totem_spring_day', name: '새싹의 토템', seasons: ['봄'], time: 'day', cost: 5, reward: { CUBE: 30, LUNAR: 20 }, stockChance: 0.8, description: '봄의 낮에 소환하여 새로운 시작의 기운을 얻습니다.' },
    { id: 'totem_yellow_dust', name: '모래폭풍의 토템', seasons: ['봄'], time: 'any', cost: 5, reward: { ENERGY: 20 }, stockChance: 0.5, description: '봄철 황사 속에서 에너지를 추출합니다.' },
    
    { id: 'totem_summer_day', name: '태양의 토템', seasons: ['여름'], time: 'day', cost: 7, reward: { ENERGY: 40 }, stockChance: 0.6, description: '뜨거운 여름의 태양 에너지를 얻습니다.' },
    { id: 'totem_thunder', name: '폭풍의 토템', seasons: ['여름'], time: 'any', cost: 4, reward: { ENERGY: 30 }, stockChance: 0.6, description: '여름의 뇌우로부터 강력한 에너지를 얻습니다.' },
    { id: 'totem_heavy_rain', name: '대홍수의 토템', seasons: ['여름'], time: 'any', cost: 5, reward: { CUBE: 100 }, stockChance: 0.4, description: '여름 장마철에 CUBE 코인을 대량으로 얻습니다.' },

    { id: 'totem_autumn_day', name: '풍요의 토템', seasons: ['가을'], time: 'day', cost: 6, reward: { DIGITAL: 5, PRISM: 5 }, stockChance: 0.7, description: '풍요로운 가을에 희귀 코인을 수확합니다.' },
    { id: 'totem_cloudy', name: '잿빛 구름의 토템', seasons: ['가을'], time: 'any', cost: 3, reward: { LUNAR: 25 }, stockChance: 0.9, description: '쓸쓸한 가을 구름으로부터 LUNAR 코인을 얻습니다.' },

    { id: 'totem_winter_night', name: '겨울잠의 토템', seasons: ['겨울'], time: 'night', cost: 4, reward: { LUNAR: 30, CUBE: 30 }, stockChance: 0.6, description: '고요한 겨울밤에 CUBE와 LUNAR 코인을 얻습니다.' },
    { id: 'totem_aurora', name: '극광의 토템', seasons: ['겨울'], time: 'night', cost: 50, reward: { AURORA: 3, DIGITAL: 15 }, stockChance: 0.1, description: '겨울 밤의 오로라로부터 전설 코인을 얻습니다.' },
    { id: 'totem_hail', name: '얼음 결정 토템', seasons: ['겨울'], time: 'any', cost: 20, reward: { DATA_CRYSTAL: 1 }, stockChance: 0.2, description: '겨울의 우박으로부터 데이터 결정을 추출합니다.' },

    // --- 공용/특별 토템 ---
    { id: 'totem_rainbow', name: '일곱빛깔 토템', seasons: ['봄', '여름', '가을'], time: 'day', cost: 10, reward: { PRISM: 25 }, stockChance: 0.2, description: '낮 동안 무지개의 기운으로 PRISM 코인을 얻습니다.' },
    { id: 'totem_shooting_star', name: '소원의 토템', seasons: ['봄', '여름', '가을', '겨울'], time: 'night', cost: 15, reward: { CUBE: 5, LUNAR: 5, ENERGY: 5, PRISM: 5 }, stockChance: 0.2, description: '밤하늘의 별똥별에 소원을 빌어 다양한 코인을 얻습니다.' },
    { id: 'totem_meteor_shower', name: '별의 축복 토템', seasons: ['봄', '여름', '가을', '겨울'], time: 'night', cost: 30, reward: { DIGITAL: 20, PRISM: 20 }, stockChance: 0.1, description: '유성우가 내리는 밤, 대량의 희귀 코인을 얻습니다.' },
    { id: 'totem_blue_moon', name: '신비로운 달의 토템', seasons: ['봄', '여름', '가을', '겨울'], time: 'night', cost: 25, reward: { LUNAR: 50, MAGIC_STONE: 1 }, stockChance: 0.15, description: '신비로운 달이 뜰 때 희귀 자원을 얻습니다.' },
    { id: 'totem_acid_rain', name: '정화의 토템', seasons: ['봄', '여름', '가을', '겨울'], time: 'any', cost: 8, reward: { MAGIC_STONE: 2 }, stockChance: 0.3, description: '언제든 나타날 수 있는 산성비를 정화하여 마법석을 얻습니다.' },
];

const MAX_COMPUTERS = 5;

const WEATHER_EFFECTS: { [key in WeatherType]: { name: string, icon: React.ElementType, color: string, description: string } } = {
  '맑음': { name: '맑음', icon: Sun, color: 'text-yellow-400', description: '특별한 효과 없음. 평화로운 날씨.' },
  '구름': { name: '구름', icon: Cloud, color: 'text-slate-400', description: '특별한 효과 없음.' },
  '비': { name: '비', icon: CloudRain, color: 'text-blue-400', description: 'CUBE 코인 채굴 확률이 소폭 상승합니다.' },
  '천둥': { name: '천둥', icon: CloudLightning, color: 'text-indigo-400', description: 'ENERGY 코인 채굴 확률이 상승하며, 가끔 인터넷 연결이 끊길 수 있습니다.' },
  '산성비': { name: '산성비', icon: CloudDrizzle, color: 'text-lime-500', description: '모든 코인 채굴 확률이 감소합니다.' },
  '무지개': { name: '무지개', icon: Rainbow, color: 'text-pink-400', description: 'PRISM 코인 채굴 확률이 대폭 상승합니다.' },
  '황사': { name: '황사', icon: Wind, color: 'text-amber-500', description: '채굴 딜레이가 소폭 증가합니다.' },
  '폭염': { name: '폭염', icon: Flame, color: 'text-red-500', description: '채굴기가 과열되어 일시적으로 작동을 멈출 수 있습니다.' },
  '폭우': { name: '폭우', icon: CloudRain, color: 'text-blue-600', description: 'CUBE 코인 채굴 확률이 대폭 상승하지만, 채굴 딜레이도 증가합니다.' },
  '눈': { name: '눈', icon: Snowflake, color: 'text-cyan-300', description: '특별한 효과 없음. 밤에 잠을 잘 수 없습니다.' },
  '별똥별': { name: '별똥별', icon: Star, color: 'text-yellow-300', description: '밤에 나타나며, 모든 코인 채굴 확률이 상승합니다.' },
  '유성우': { name: '유성우', icon: Star, color: 'text-orange-300', description: '밤에 나타나며, 모든 코인 채굴 확률이 대폭 상승하고 희귀 코인 발견 확률이 증가합니다.' },
  '우박': { name: '우박', icon: AlertTriangle, color: 'text-gray-400', description: '모든 코인 채굴 확률이 감소합니다.' },
  '오로라': { name: '오로라', icon: Sunset, color: 'text-teal-400', description: '겨울 밤에 희귀하게 나타나며, 전설적인 AURORA 코인을 채굴할 수 있습니다!' },
  '블루문': { name: '블루문', icon: Moon, color: 'text-blue-300', description: '맑은 날이 지속되면 나타나며, 채굴 딜레이가 감소합니다.' },
};
const SEASONS: Season[] = ['봄', '여름', '가을', '겨울'];
const SEASON_ICONS: { [key in Season]: string } = { '봄': '🌸', '여름': '☀️', '가을': '🍁', '겨울': '❄️' };

// --- 타입 정의 ---
interface GameState {
  money: number;
  inventory: { 
    CUBE: number; 
    LUNAR: number; 
    ENERGY: number; 
    PRISM: number; 
    DIGITAL: number;
    AURORA: number;
    MAGIC_STONE: number;
    DATA_CRYSTAL: number;
  };
  myComputers: Array<{ instanceId: number; typeId: string; tier: number; name: string; nextMineTime: number; }>;
  resourceMinerLevel: number; 
  codeExecutorLevel: number; // 0: 없음, 1, 2, 3
  logs: string[];
  weather: WeatherType;
  nextWeather: WeatherType;
  displayedNextWeather: WeatherType;
  internetOnline: boolean;
  gameTime: { day: number; hour: number; minute: number; };
  season: Season;
  ownedItems: { clock: boolean; bed: boolean; almanac: boolean; forecaster: boolean; };
  stoppedMiners: Array<[number, number]>;
  tutorialCompleted: boolean;
  advancedTutorialStep: number; // New flow: 1-9
  experiencedWeather: WeatherType[];
  settings: { notifications: boolean; };
  totemStock: { [key: string]: boolean };
  nextTotemRestockTime: number;
}
type ToastType = { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error'; icon: React.ElementType };

// --- 날씨 생성 유틸리티 ---
const generateNewWeather = (season: Season, currentIsNight: boolean, lastWeather: WeatherType, consecutiveClear: number): WeatherType => {
    let nextWeather: WeatherType;
    const rand = Math.random();

    if (currentIsNight && rand < 0.1) {
        if (Math.random() < 0.15) { 
            nextWeather = '유성우';
        } else {
            nextWeather = (season === '겨울' && Math.random() < 0.05) ? '오로라' : '별똥별';
        }
    } else if ((['비', '산성비', '폭우'].includes(lastWeather)) && rand < 0.1) {
        nextWeather = '무지개';
    } else if (consecutiveClear >= 3 && rand < 0.1) {
        nextWeather = '블루문';
    } else {
        let baseRand = Math.random();
        switch(season) {
            case '봄': if (baseRand < 0.15) nextWeather = '황사'; else if (baseRand < 0.55) nextWeather = '맑음'; else if (baseRand < 0.8) nextWeather = '구름'; else if (baseRand < 0.95) nextWeather = '비'; else nextWeather = '천둥'; break;
            case '여름': if (baseRand < 0.2) nextWeather = '폭염'; else if (baseRand < 0.3) nextWeather = '맑음'; else if (baseRand < 0.5) nextWeather = '구름'; else if (baseRand < 0.85) nextWeather = '비'; else nextWeather = '천둥'; break;
            case '가을': if (baseRand < 0.4) nextWeather = '맑음'; else if (baseRand < 0.7) nextWeather = '구름'; else if (baseRand < 0.9) nextWeather = '비'; else nextWeather = '천둥'; break;
            case '겨울': if (baseRand < 0.3) nextWeather = '맑음'; else if (baseRand < 0.6) nextWeather = '구름'; else if (baseRand < 0.9) nextWeather = '눈'; else nextWeather = '천둥'; break;
            default: nextWeather = '맑음';
        }
        if (nextWeather === '비') {
            if (season === '여름' && Math.random() < 0.2) nextWeather = '폭우';
            else if (Math.random() < 0.1) nextWeather = '산성비';
        }
        if (nextWeather === '눈' && Math.random() < 0.1) nextWeather = '우박';
    }
    return nextWeather;
};

// --- 초기 게임 상태 ---
const initialGameState: GameState = {
  money: 100000, 
  inventory: { CUBE: 0, LUNAR: 0, ENERGY: 0, PRISM: 0, DIGITAL: 0, AURORA: 0, MAGIC_STONE: 0, DATA_CRYSTAL: 0 }, 
  myComputers: [], 
  resourceMinerLevel: 0,
  codeExecutorLevel: 0,
  logs: ["게임에 오신 것을 환영합니다!"], 
  weather: '맑음', 
  nextWeather: '맑음',
  displayedNextWeather: '맑음',
  internetOnline: true, 
  gameTime: { day: 1, hour: 9, minute: 0 }, 
  season: '봄', 
  ownedItems: { clock: false, bed: false, almanac: false, forecaster: false }, 
  stoppedMiners: [], 
  tutorialCompleted: false, 
  advancedTutorialStep: 0,
  experiencedWeather: ['맑음'], 
  settings: { notifications: true },
  totemStock: {},
  nextTotemRestockTime: Date.now() + 300000,
};

const useDebouncedEffect = (effect: () => void, deps: any[], delay: number) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [storeTab, setStoreTab] = useState<'items' | 'totems'>('items');
  const [labTab, setLabTab] = useState<'resource' | 'code'>('resource');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const { money, inventory, myComputers, logs, weather, internetOnline, gameTime, season, ownedItems, stoppedMiners, tutorialCompleted, experiencedWeather, settings, nextWeather, displayedNextWeather, resourceMinerLevel, codeExecutorLevel, advancedTutorialStep, totemStock, nextTotemRestockTime } = gameState;
  const isTutorialActive = !tutorialCompleted && tutorialStep > 0;
  
  const consecutiveClear = useRef(0);
  const resourceTick = useRef(0);
  const codeTick = useRef(0);
  
  const addToast = useCallback((message: string, type: ToastType['type'] = 'info') => {
    if (!gameState.settings.notifications) return;
    const icons = { info: Info, success: CheckCircle, warning: AlertTriangle, error: Flame };
    const newToast: ToastType = { id: Date.now(), message, type, icon: icons[type] };
    setToasts(prev => [newToast, ...prev]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
    }, 4000);
  }, [gameState.settings.notifications]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const handleOpenModal = (modal: string) => {
    if (isTutorialActive) {
      if (tutorialStep === 2 && modal === 'hardware_store') setTutorialStep(3);
      else if (tutorialStep === 4 && modal === 'wallet') setTutorialStep(5);
    }
    if (advancedTutorialStep === 2 && modal === 'lab') updateGameState({ advancedTutorialStep: 3 });
    if (advancedTutorialStep === 5 && modal === 'lab') updateGameState({ advancedTutorialStep: 6 });
    if (advancedTutorialStep === 8 && modal === 'general_store') {
       setStoreTab('totems'); // Directly open totems tab for tutorial
       updateGameState({ advancedTutorialStep: 9 });
    }
    setActiveModal(modal);
  };
  
  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...newState }));
  }, []);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => {
        const timeString = prev.ownedItems.clock ? `${prev.gameTime.day}일 ${String(prev.gameTime.hour).padStart(2, '0')}:${String(prev.gameTime.minute).padStart(2, '0')}` : new Date().toLocaleTimeString();
        return {
            ...prev,
            logs: [`[${timeString}] ${msg}`, ...prev.logs].slice(0, 50)
        };
    });
  }, []);

  const restockTotems = useCallback(() => {
    const newStock: { [key: string]: boolean } = {};
    TOTEMS.forEach(totem => {
        if (Math.random() < totem.stockChance) {
            newStock[totem.id] = true;
        }
    });
    setGameState(prev => ({ ...prev, totemStock: newStock, nextTotemRestockTime: Date.now() + 300000 }));
    addLog("🛒 토템 상점의 재고가 변경되었습니다.");
  }, [addLog]);

  // --- Firebase 연동 ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedData = docSnap.data() as Partial<GameState>;
          const defaultInv = initialGameState.inventory;
          const mergedInv = { ...defaultInv, ...(loadedData.inventory || {}) };
          if ('ALPHA' in mergedInv) {
             // @ts-ignore
             delete mergedInv.ALPHA;
          }

          const loadedState = { 
            ...initialGameState, 
            ...loadedData,
            inventory: mergedInv,
            myComputers: (loadedData.myComputers || []).map(c => ({...c, nextMineTime: c.nextMineTime || Date.now()})),
            totemStock: loadedData.totemStock || {},
          };
          
          if (!loadedData.nextWeather) {
              const { season, gameTime, weather } = loadedState;
              const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
              loadedState.nextWeather = generateNewWeather(season, isNight, weather, 0);
              loadedState.displayedNextWeather = loadedState.nextWeather;
          }
          if (!loadedData.nextTotemRestockTime || loadedData.nextTotemRestockTime < Date.now()) {
            restockTotems();
          } else {
            loadedState.nextTotemRestockTime = loadedData.nextTotemRestockTime;
          }
          setGameState(loadedState);

          if (!loadedState.tutorialCompleted) {
              setTutorialStep(1);
          } else if (loadedState.advancedTutorialStep === 0) {
              updateGameState({ advancedTutorialStep: 1 });
          }
        } else {
          const newGameState = { ...initialGameState };
          const { season, gameTime, weather } = newGameState;
          const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
          newGameState.nextWeather = generateNewWeather(season, isNight, weather, 0);
          newGameState.displayedNextWeather = newGameState.nextWeather;
          restockTotems();
          setGameState(newGameState);
          setTutorialStep(1);
        }
      } else {
        setUser(null);
        setGameState(initialGameState);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [restockTotems]);

  useDebouncedEffect(() => {
    if (user && !loading) {
      const stateToSave = { ...gameState };
      setDoc(doc(db, "users", user.uid), stateToSave);
    }
  }, [gameState, user, loading], 1500);

  const handleSignOut = () => {
    signOut(auth);
    addToast("로그아웃되었습니다.", "success");
  };

  const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // --- 시간 & 계절 루프 ---
  useEffect(() => {
      const timeInterval = setInterval(() => {
          setGameState(prev => {
              let { day, hour, minute } = prev.gameTime;
              minute += 1;
              if (minute >= 60) {
                  minute = 0; hour += 1;
                  if (hour >= 24) {
                      hour = 0; day += 1;
                      if ((day - 1) % 30 === 0 && day > 1) { // 30일마다 계절 변경
                          const nextIndex = (SEASONS.indexOf(prev.season) + 1) % SEASONS.length;
                          const newSeason = SEASONS[nextIndex];
                          addToast(`계절이 ${newSeason}(으)로 바뀌었습니다.`, 'info');
                          return { ...prev, gameTime: { day, hour, minute }, season: newSeason };
                      }
                  }
              }
              return { ...prev, gameTime: { day, hour, minute } };
          });
      }, 250);
      return () => clearInterval(timeInterval);
  }, [addToast]);

  // --- 메인 채굴 로직 ---
  const mine = useCallback(() => {
    const now = Date.now();
    const stoppedMinersMap = new Map(stoppedMiners);
    const minedCoins: { [key in keyof typeof COIN_TYPES]?: number } = {};
    let updatedComputers = [...myComputers];
    let computerUpdates = false;
    
    // 1. 컴퓨터 채굴 로직 (티어별 개별 주기 적용)
    if (myComputers.length > 0) {
        updatedComputers = myComputers.map(comp => {
            if (stoppedMinersMap.has(comp.instanceId)) return comp;
            if (!comp.nextMineTime) comp.nextMineTime = now;

            if (now >= comp.nextMineTime) {
                computerUpdates = true;
                const originalComp = COMPUTERS.find(c => c.tier === comp.tier);
                const interval = originalComp ? originalComp.interval : 4000;
                comp.nextMineTime = now + interval;

                const roll = Math.random();
                const mineCoin = (key: keyof typeof COIN_TYPES, chance: number) => {
                    let finalChance = chance;
                    switch(weather) {
                        case '비': if(key === 'CUBE') finalChance += 0.0025; break;
                        case '천둥': if(key === 'ENERGY') finalChance += 0.0015; break;
                        case '산성비': finalChance *= 0.8; break;
                        case '무지개': if(key === 'PRISM') finalChance += 0.01; break;
                        case '폭우': if(key === 'CUBE') finalChance += 0.005; break;
                        case '별똥별': finalChance *= 1.1; break;
                        case '유성우': finalChance *= 1.5; break;
                        case '우박': finalChance *= 0.8; break;
                        case '오로라': finalChance *= 1.2; break;
                    }

                    if (Math.random() < finalChance) {
                         minedCoins[key] = (minedCoins[key] || 0) + 1;
                    }
                }
                
                // 티어별 확률 조정
                if (comp.tier === 1) {
                    mineCoin('CUBE', 0.04); // 2x
                    mineCoin('LUNAR', 0.03); // 2x
                } else if (comp.tier === 2) {
                    mineCoin('CUBE', 0.04);
                    mineCoin('LUNAR', 0.03);
                    mineCoin('ENERGY', 0.02);
                    mineCoin('PRISM', 0.01);
                } else if (comp.tier === 3) {
                    mineCoin('CUBE', 0.03); // 0.5x
                    mineCoin('LUNAR', 0.025); // 0.5x
                    mineCoin('ENERGY', 0.0175); // 0.5x
                    mineCoin('PRISM', 0.01); // 0.5x
                    mineCoin('DIGITAL', 0.0025); // 0.5x
                } else if (comp.tier === 4) {
                    mineCoin('CUBE', 0.035); // 0.5x
                    mineCoin('LUNAR', 0.0275); // 0.5x
                    mineCoin('ENERGY', 0.0225); // 0.5x
                    mineCoin('PRISM', 0.0175); // 0.5x
                    mineCoin('DIGITAL', 0.0075); // 0.5x
                    if (weather === '오로라') mineCoin('AURORA', 0.004); // 0.5x
                } else if (comp.tier === 5) {
                    mineCoin('CUBE', 0.04); // 0.5x
                    mineCoin('LUNAR', 0.035); // 0.5x
                    mineCoin('ENERGY', 0.025); // 0.5x
                    mineCoin('PRISM', 0.015); // 0.5x
                    mineCoin('DIGITAL', 0.01); // 0.5x
                    if (weather === '오로라') mineCoin('AURORA', 0.006); // 0.5x
                }
            }
            return comp;
        });
    }

    // 2. 차원 채굴기 (마법석) - 100ms 틱 기반
    resourceTick.current += 1;
    const rTick = resourceTick.current;
    let stonesThisTick = 0;
    
    if (resourceMinerLevel === 1) {
        if (rTick % 40 === 0 && Math.random() < 0.10) stonesThisTick += 1; // 4초당 10%
    } else if (resourceMinerLevel === 2) {
        if (rTick % 40 === 0 && Math.random() < 0.15) stonesThisTick += 1; // 4초당 15%
        if (rTick % 80 === 0 && Math.random() < 0.02) stonesThisTick += 2; // 8초당 2%
    } else if (resourceMinerLevel === 3) {
        if (rTick % 40 === 0 && Math.random() < 0.20) stonesThisTick += 1; // 4초당 20%
        if (rTick % 80 === 0 && Math.random() < 0.05) stonesThisTick += 2; // 8초당 5%
    } else if (resourceMinerLevel === 4) {
        if (rTick % 40 === 0 && Math.random() < 0.25) stonesThisTick += 1; // 4초당 25%
        if (rTick % 60 === 0 && Math.random() < 0.08) stonesThisTick += 2; // 6초당 8%
        if (rTick % 200 === 0 && Math.random() < 0.04) stonesThisTick += 3; // 20초당 4%
    }
    if (stonesThisTick > 0) minedCoins['MAGIC_STONE'] = stonesThisTick;

    // 3. 코드 실행기 (데이터 결정) - 100ms 틱 기반
    codeTick.current += 1;
    const cTick = codeTick.current;
    let dataCrystalsThisTick = 0;

    if (codeExecutorLevel >= 1 && cTick % 50 === 0) { // 5초 인터벌
        let chance = 0;
        if (codeExecutorLevel === 1) chance = 0.10;
        else if (codeExecutorLevel === 2) chance = 0.15;
        else if (codeExecutorLevel === 3) chance = 0.20;

        if (Math.random() < chance) {
            dataCrystalsThisTick += 1;
            if (codeExecutorLevel === 2 && Math.random() < 0.20) dataCrystalsThisTick += 1;
            if (codeExecutorLevel === 3 && Math.random() < 0.40) dataCrystalsThisTick += 1;
        }
    }
    if (dataCrystalsThisTick > 0) minedCoins['DATA_CRYSTAL'] = dataCrystalsThisTick;


    // 4. 결과 적용
    const hasMined = Object.keys(minedCoins).length > 0;
    
    if (hasMined || computerUpdates) {
        setGameState(prev => {
            const newInventory = { ...prev.inventory };

            if (hasMined) {
                for (const key in minedCoins) {
                    const coinKey = key as keyof typeof COIN_TYPES;
                    newInventory[coinKey] = (newInventory[coinKey] || 0) + (minedCoins[coinKey] || 0);
                }
            }
            return { 
                ...prev, 
                inventory: newInventory,
                myComputers: computerUpdates ? updatedComputers : prev.myComputers,
            };
        });

        if (hasMined) {
            const msgParts = [];
            for (const key in minedCoins) {
                 // @ts-ignore
                 msgParts.push(`${key} +${minedCoins[key]}`);
            }
            addToast(`채굴 성공: ${msgParts.join(', ')}`, 'success');
            
             const rareItems = ['PRISM', 'DIGITAL', 'AURORA', 'MAGIC_STONE', 'DATA_CRYSTAL'];
             const rareMsg = Object.entries(minedCoins)
                .filter(([k]) => rareItems.includes(k))
                .map(([k, v]) => `${k} x${v}`)
                .join(', ');
             if (rareMsg) addLog(`💎 희귀 아이템 발견: ${rareMsg}`);
        }
    }
  }, [myComputers, weather, stoppedMiners, addLog, addToast, resourceMinerLevel, codeExecutorLevel]);
  
  useEffect(() => {
    const miningInterval = setInterval(() => {
      if (internetOnline) { 
        mine();
      }
    }, 100);
    return () => clearInterval(miningInterval);
  }, [mine, internetOnline]);


  useEffect(() => {
    const weatherInterval = setInterval(() => {
      setGameState(prev => {
          const { gameTime, season, weather, nextWeather, experiencedWeather } = prev;
          const currentIsNight = gameTime.hour >= 20 || gameTime.hour < 9;
          const newWeather = nextWeather;
          if (newWeather === '맑음') consecutiveClear.current++; else consecutiveClear.current = 0;
          
          const newNextWeather = generateNewWeather(season, currentIsNight, newWeather, consecutiveClear.current);
          if (newNextWeather === '블루문') consecutiveClear.current = 0;
          
          let newDisplayedNextWeather = newNextWeather;
          if (Math.random() < 0.4) { // 40% chance to be wrong
            const weatherOptions = Object.keys(WEATHER_EFFECTS) as WeatherType[];
            newDisplayedNextWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
          }

          const newState: GameState = { ...prev, weather: newWeather, nextWeather: newNextWeather, displayedNextWeather: newDisplayedNextWeather };
          
          if (weather !== newWeather) {
              addToast(`날씨가 ${WEATHER_EFFECTS[newWeather].name}(으)로 변경`, 'info');
              if (!experiencedWeather.includes(newWeather)) {
                  newState.experiencedWeather = [...experiencedWeather, newWeather];
              }
          }
          
          if (!prev.internetOnline) {
              newState.internetOnline = true;
              addToast("📡 인터넷 연결이 복구되었습니다.", "success");
          }
          return newState;
      });
    }, 30000);
    return () => clearInterval(weatherInterval);
  }, [addToast]);
  
  useEffect(() => {
    const totemInterval = setInterval(restockTotems, 300000); // 5 minutes
    return () => clearInterval(totemInterval);
  }, [restockTotems]);

  useEffect(() => {
    if (!internetOnline) return;
    const effectInterval = setInterval(() => {
        if (weather === '천둥' && Math.random() < 0.05) {
            updateGameState({ internetOnline: false });
            addToast("⚡️ 인터넷 연결이 끊겼습니다!", 'warning');
        }
        if (weather === '폭염' && myComputers.length > 0 && Math.random() < 0.2) {
            const stoppedMinersMap = new Map(stoppedMiners);
            const availableComputers = myComputers.filter(c => !stoppedMinersMap.has(c.instanceId));
            if (availableComputers.length > 0) {
                const target = availableComputers[Math.floor(Math.random() * availableComputers.length)];
                const stopUntil = Date.now() + 5000;
                const newStoppedMiners = Array.from(new Map(stoppedMiners).set(target.instanceId, stopUntil));
                updateGameState({ stoppedMiners: newStoppedMiners });
                addToast(`🔥 폭염으로 ${target.name} 작동 중지!`, 'error');
            }
        }
        if (stoppedMiners.length > 0) {
            const now = Date.now();
            const updatedStoppedMiners = stoppedMiners.filter(([, stopUntil]) => now < stopUntil);
            if (updatedStoppedMiners.length !== stoppedMiners.length) {
              updateGameState({ stoppedMiners: updatedStoppedMiners });
            }
        }
    }, 1000);
    return () => clearInterval(effectInterval);
  }, [weather, internetOnline, addToast, myComputers, stoppedMiners, updateGameState]);

  useEffect(() => {
      if (tutorialCompleted && advancedTutorialStep === 0) {
          updateGameState({ advancedTutorialStep: 1 });
      }
  }, [tutorialCompleted, advancedTutorialStep, updateGameState]);

  // --- Advanced Tutorial Progression ---
  useEffect(() => {
    if (!tutorialCompleted || advancedTutorialStep === 0 || advancedTutorialStep >= 9) return;

    if (advancedTutorialStep === 1 && inventory.LUNAR >= 20) {
        updateGameState({ advancedTutorialStep: 2 });
    } else if (advancedTutorialStep === 3 && resourceMinerLevel > 0) {
        updateGameState({ advancedTutorialStep: 4 });
    } else if (advancedTutorialStep === 4 && inventory.DIGITAL >= 5) {
        updateGameState({ advancedTutorialStep: 5 });
    } else if (advancedTutorialStep === 6 && codeExecutorLevel > 0) {
        updateGameState({ advancedTutorialStep: 7 });
    } else if (advancedTutorialStep === 7 && inventory.MAGIC_STONE >= 5) {
        updateGameState({ advancedTutorialStep: 8 });
    }

  }, [tutorialCompleted, advancedTutorialStep, inventory.LUNAR, inventory.DIGITAL, inventory.MAGIC_STONE, resourceMinerLevel, codeExecutorLevel, updateGameState]);


  // --- 액션 함수 ---
  const buyComputer = (computerType: typeof COMPUTERS[0]) => {
    if (myComputers.length >= MAX_COMPUTERS) {
      addToast(`최대 ${MAX_COMPUTERS}개의 PC만 보유할 수 있습니다.`, 'warning');
      return;
    }
    
    let canAfford = false;
    if (computerType.costType === 'MONEY') canAfford = money >= computerType.cost;
    else if (computerType.costType === 'DATA_CRYSTAL') canAfford = inventory.DATA_CRYSTAL >= computerType.cost;

    if (canAfford) {
        const updates: Partial<GameState> = {
             myComputers: [...myComputers, { 
                 instanceId: Date.now() + Math.random(), 
                 typeId: computerType.id, 
                 tier: computerType.tier, 
                 name: computerType.name,
                 nextMineTime: Date.now() + computerType.interval
            }]
        };

        if (computerType.costType === 'MONEY') updates.money = money - computerType.cost;
        else if (computerType.costType === 'DATA_CRYSTAL') updates.inventory = { ...inventory, DATA_CRYSTAL: inventory.DATA_CRYSTAL - computerType.cost };
        
        updateGameState(updates);
        addLog(`✅ ${computerType.name} 구매 완료`);
        if (isTutorialActive && tutorialStep === 3) {
            setActiveModal(null);
            setTutorialStep(4);
        }
    } else {
        addToast("재화가 부족합니다.", "error");
    }
  };

  const sellComputer = (instanceId: number) => {
    const computer = myComputers.find(c => c.instanceId === instanceId);
    const originalInfo = COMPUTERS.find(c => c.id === computer?.typeId);
    if (!computer || !originalInfo) return;
    
    let refund = 0;
    if (originalInfo.costType === 'MONEY') {
        refund = originalInfo.cost * 0.25;
        updateGameState({ money: money + refund, myComputers: myComputers.filter(c => c.instanceId !== instanceId) });
    } else {
        refund = 50000;
        updateGameState({ money: money + refund, myComputers: myComputers.filter(c => c.instanceId !== instanceId) });
    }
    
    addLog(`💻 ${computer.name} 판매, ${refund.toLocaleString()} KRW 획득`);
  };
  
  const buyGeneralItem = (item: typeof GENERAL_STORE_ITEMS[0]) => {
      if (money >= item.cost && !ownedItems[item.id as keyof typeof ownedItems]) {
          updateGameState({ money: money - item.cost, ownedItems: { ...ownedItems, [item.id]: true } });
          addLog(`🛍️ ${item.name} 구매 완료!`);
      }
  };

  const buyTotem = (totem: typeof TOTEMS[0]) => {
    const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
    const currentTimeOfDay = isNight ? 'night' : 'day';

    const isCorrectSeason = totem.seasons.includes(season);
    const isCorrectTime = totem.time === 'any' || totem.time === currentTimeOfDay;

    if (!isCorrectSeason || !isCorrectTime) {
        addToast("현재 계절이나 시간에 맞는 토템이 아닙니다.", "warning");
        return;
    }
    if (inventory.MAGIC_STONE < totem.cost) {
        addToast("마법석이 부족합니다.", "error");
        return;
    }

    const newInventory = { ...inventory };
    newInventory.MAGIC_STONE -= totem.cost;
    
    const msgs: string[] = [];
    Object.entries(totem.reward).forEach(([key, val]) => {
        // @ts-ignore
        newInventory[key] = (newInventory[key] || 0) + val;
        msgs.push(`${key} +${val}`);
    });
    
    const newTotemStock = { ...totemStock };
    delete newTotemStock[totem.id];

    updateGameState({ inventory: newInventory, totemStock: newTotemStock });
    addToast(`🗿 ${totem.name} 소환 성공! ${msgs.join(', ')}`, 'success');
    addLog(`⚡️ ${totem.name}의 힘으로 코인이 쏟아집니다!`);
  };

  const sleep = () => {
    if(ownedItems.bed && isNight && gameTime.hour >= 21 && weather !== '눈') {
        const nextDay = gameTime.day + 1;
        let newSeason = season;
        if ((nextDay - 1) % 30 === 0) {
           const nextIndex = (SEASONS.indexOf(season) + 1) % SEASONS.length;
           newSeason = SEASONS[nextIndex];
           addToast(`잠을 자는 동안 계절이 ${newSeason}(으)로 바뀌었습니다.`, 'info');
        }
        updateGameState({ gameTime: { day: nextDay, hour: 8, minute: 0 }, season: newSeason });
        addLog('🌙 잠을 자고 상쾌한 아침을 맞이했습니다.');
    } else if (weather === '눈') {
        addToast('🌨️ 너무 추워서 잠을 잘 수 없습니다.', 'warning');
    }
  };

  const sellCoin = (type: keyof typeof COIN_TYPES) => {
    if (!COIN_TYPES[type].sellable) {
        addToast("이 아이템은 판매할 수 없습니다.", "warning");
        return;
    }
    const count = inventory[type];
    if (count > 0) {
      const value = count * COIN_TYPES[type].value;
      updateGameState({ inventory: { ...inventory, [type]: 0 }, money: money + value });
      addLog(`💰 ${count} ${type} 판매, ${value.toLocaleString()} KRW 획득`);
      if(isTutorialActive && tutorialStep === 5) setTutorialStep(6);
    }
  };

  const sellAll = () => {
    let totalValue = 0;
    const newInventory = { ...inventory };
    
    (Object.keys(COIN_TYPES) as Array<keyof typeof COIN_TYPES>).forEach(key => {
        if (COIN_TYPES[key].sellable) {
            totalValue += inventory[key] * COIN_TYPES[key].value;
            newInventory[key] = 0;
        }
    });

    if (totalValue > 0) {
      updateGameState({ inventory: newInventory, money: money + totalValue });
      addLog(`💰 모든 코인 판매, ${totalValue.toLocaleString()} KRW 획득`);
    }
    if (isTutorialActive && tutorialStep === 5) setTutorialStep(6);
  };

  const upgradeResourceMiner = () => {
      const currentLevel = resourceMinerLevel;
      if (currentLevel === 0) {
          if (inventory.LUNAR >= 20) {
              updateGameState({
                  inventory: { ...inventory, LUNAR: inventory.LUNAR - 20 },
                  resourceMinerLevel: 1
              });
              addLog("⛏️ 차원 채굴기가 실시간으로 마법석을 채굴하기 시작합니다!");
              addToast("차원 채굴기 설치 완료!", "success");
          } else { addToast("LUNAR 코인이 부족합니다. (필요: 20)", "error"); }
      } else if (currentLevel === 1) {
          if (inventory.MAGIC_STONE >= 10) {
              updateGameState({ inventory: { ...inventory, MAGIC_STONE: inventory.MAGIC_STONE - 10 }, resourceMinerLevel: 2 });
              addLog("⛏️ 차원 채굴기 2차원으로 강화 성공!");
              addToast("업그레이드 성공!", "success");
          } else { addToast("마법석이 부족합니다. (필요: 10)", "error"); }
      } else if (currentLevel === 2) {
          if (inventory.MAGIC_STONE >= 20) {
              updateGameState({ inventory: { ...inventory, MAGIC_STONE: inventory.MAGIC_STONE - 20 }, resourceMinerLevel: 3 });
              addLog("⛏️ 차원 채굴기 3차원으로 강화 성공!");
              addToast("업그레이드 성공!", "success");
          } else { addToast("마법석이 부족합니다. (필요: 20)", "error"); }
      } else if (currentLevel === 3) {
          if (inventory.MAGIC_STONE >= 50) {
              updateGameState({ inventory: { ...inventory, MAGIC_STONE: inventory.MAGIC_STONE - 50 }, resourceMinerLevel: 4 });
              addLog("⛏️ 차원 채굴기 4차원으로 강화 성공!");
              addToast("최종 단계 업그레이드 성공!", "success");
          } else { addToast("마법석이 부족합니다. (필요: 50)", "error"); }
      }
  };

  const upgradeCodeExecutor = () => {
      const level = codeExecutorLevel;
      if (level === 0) {
          if (inventory.DIGITAL >= 5) {
              updateGameState({
                  inventory: { ...inventory, DIGITAL: inventory.DIGITAL - 5 },
                  codeExecutorLevel: 1
              });
              addLog("💾 코드 실행기 (1티어) 설치 완료!");
              addToast("설치 성공", "success");
          } else { addToast("DIGITAL 코인이 부족합니다. (필요: 5)", "error"); }
      } else if (level === 1) {
          if (inventory.DIGITAL >= 10 && inventory.DATA_CRYSTAL >= 5) {
              updateGameState({ inventory: { ...inventory, DIGITAL: inventory.DIGITAL - 10, DATA_CRYSTAL: inventory.DATA_CRYSTAL - 5 }, codeExecutorLevel: 2 });
              addLog("💾 코드 실행기 2티어 업그레이드!");
              addToast("업그레이드 성공", "success");
          } else { addToast("재화가 부족합니다.", "error"); }
      } else if (level === 2) {
          if (inventory.DIGITAL >= 20 && inventory.DATA_CRYSTAL >= 20) {
              updateGameState({ inventory: { ...inventory, DIGITAL: inventory.DIGITAL - 20, DATA_CRYSTAL: inventory.DATA_CRYSTAL - 20 }, codeExecutorLevel: 3 });
              addLog("💾 코드 실행기 3티어 업그레이드!");
              addToast("최종 업그레이드 성공", "success");
          } else { addToast("재화가 부족합니다.", "error"); }
      }
  };
  
  // --- 렌더링 로직 ---
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><LoaderCircle className="animate-spin w-10 h-10" /></div>;
  if (!user) return <LoginScreen />;

  const CurrentWeatherIcon = WEATHER_EFFECTS[weather].icon;
  const NextWeatherIcon = displayedNextWeather ? WEATHER_EFFECTS[displayedNextWeather].icon : null;
  const stoppedMinersMap = new Map(stoppedMiners);
  
  const ScreenEffect = () => {
    switch (weather) {
      case '황사': return <div className="fixed inset-0 bg-yellow-600/10 backdrop-blur-[1px] pointer-events-none z-50"></div>;
      case '폭염': return <div className="fixed inset-0 bg-red-700/5 pointer-events-none z-50 animate-pulse-slow"></div>;
      case '눈': return <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">{Array.from({ length: 50 }).map((_, i) => (<div key={i} className="snowflake"></div>))}</div>;
      case '오로라': return <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-teal-900/20 via-purple-900/20 to-transparent mix-blend-screen animate-pulse-slow"></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative selection:bg-emerald-500/20">
      <ScreenEffect />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {isTutorialActive && <Tutorial step={tutorialStep} setStep={setTutorialStep} completeTutorial={() => updateGameState({ tutorialCompleted: true })} />}
      {tutorialCompleted && advancedTutorialStep > 0 && advancedTutorialStep < 10 && <AdvancedTutorial step={advancedTutorialStep} gameState={gameState} />}
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
            <Terminal className="w-8 h-8 text-emerald-400" />
            암호화폐 채굴 타이쿤
          </h1>
          <p className="text-slate-500 text-sm mt-1">플레이어: {user.email?.split('@')[0] || '익명'}</p>
        </div>
        
        <div className="flex items-center flex-wrap justify-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          {ownedItems.clock && (
            <>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg"><Clock className="w-6 h-6 text-slate-400"/></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">시간</p>
                <p className="text-xl font-bold font-mono">{String(gameTime.hour).padStart(2, '0')}:{String(gameTime.minute).padStart(2, '0')}</p>
                <p className="text-xs text-slate-500">{gameTime.day}일차, {season} {SEASON_ICONS[season]}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-800 hidden sm:block"></div>
            </>
          )}
          <div className="flex items-center gap-3" title={`현재 날씨: ${WEATHER_EFFECTS[weather].name}`}>
              <div className={`p-2 bg-opacity-30 rounded-lg`}>
                <CurrentWeatherIcon className={`w-6 h-6 ${WEATHER_EFFECTS[weather].color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">현재 날씨</p>
                <p className={`text-xl font-bold ${WEATHER_EFFECTS[weather].color}`}>{WEATHER_EFFECTS[weather].name}</p>
              </div>
          </div>
          
          {ownedItems.forecaster && displayedNextWeather && (
            <>
            <div className="w-px h-10 bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-3" title={`다음 날씨 예보: ${WEATHER_EFFECTS[displayedNextWeather].name}`}>
                <div className={`p-2 bg-opacity-30 rounded-lg`}>
                    {NextWeatherIcon && <NextWeatherIcon className={`w-6 h-6 ${WEATHER_EFFECTS[displayedNextWeather].color}`} />}
                </div>
                <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">다음 예보</p>
                    <p className={`text-xl font-bold ${WEATHER_EFFECTS[displayedNextWeather].color}`}>{WEATHER_EFFECTS[displayedNextWeather].name} {nextWeather !== displayedNextWeather && '?'}</p>
                </div>
            </div>
            </>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="pb-24">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 space-y-8">
                {/* Main Mining Dashboard */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Server className="text-indigo-400" />채굴 현황 ({myComputers.length}/{MAX_COMPUTERS})</h2>
                        <div className={`flex items-center gap-2 text-xs font-mono ${internetOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {internetOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {internetOnline ? (myComputers.length > 0 ? '● 시스템 온라인' : '○ 시스템 유휴') : '⚠ 인터넷 오프라인'}
                        </div>
                    </div>
                    {myComputers.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/50">
                            <Cpu className="w-12 h-12 mb-2 opacity-50" />
                            <p>활성화된 채굴 장비가 없습니다.</p>
                            <p className="text-sm">상점에서 컴퓨터를 구매하여 채굴을 시작하세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {myComputers.map((comp) => {
                                const isStopped = stoppedMinersMap.has(comp.instanceId);
                                const originalComp = COMPUTERS.find(c => c.id === comp.typeId);
                                return (
                                <div key={comp.instanceId} className={`relative bg-slate-800/50 p-3 rounded-lg border flex flex-col items-center gap-2 group transition-all ${isStopped ? 'border-red-500/50' : 'border-indigo-500/20 hover:border-indigo-500/50'}`}>
                                    {(internetOnline && !isStopped) && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-ping-slow"></div>}
                                    {(!internetOnline || isStopped) && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
                                    <div className="p-2 bg-slate-900 rounded-full">
                                        {originalComp?.icon && React.createElement(originalComp.icon, { className: `w-6 h-6 ${isStopped ? 'text-slate-600' : 'text-slate-300'}` })}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm text-slate-200">{comp.name}</p>
                                        <p className={`text-xs ${isStopped ? 'text-red-400' : 'text-indigo-400'}`}>{isStopped ? '과열' : `Tier ${comp.tier}`}</p>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden">
                                        { originalComp && <MiningProgress startTime={comp.nextMineTime - originalComp.interval} duration={originalComp.interval} isPaused={!internetOnline || isStopped} currentTime={currentTime} />}
                                    </div>
                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => sellComputer(comp.instanceId)} className="text-[10px] bg-red-900/50 hover:bg-red-900/80 text-red-300 px-2 py-0.5 rounded">판매</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {/* Special Miners Status (Mini View) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resourceMinerLevel > 0 && (
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-900/20 rounded-full border border-pink-500/30">
                                    <Pickaxe className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200">차원 채굴기</h3>
                                    <p className="text-xs text-pink-400 font-mono">{resourceMinerLevel}차원 가동 중</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Magic Stone</p>
                                <p className="text-lg font-bold text-pink-300 font-mono">{inventory.MAGIC_STONE}</p>
                            </div>
                        </div>
                    )}
                    {codeExecutorLevel > 0 && (
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-900/20 rounded-full border border-emerald-500/30">
                                    <Database className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200">코드 실행기</h3>
                                    <p className="text-xs text-emerald-400 font-mono">Tier {codeExecutorLevel} 실행 중</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Data Crystal</p>
                                <p className="text-lg font-bold text-emerald-300 font-mono">{inventory.DATA_CRYSTAL}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Logs */}
                <div className="bg-black rounded-xl border border-slate-800 p-4 shadow-inner font-mono text-sm h-48 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-900 pb-2"><Terminal className="w-4 h-4" /><span>시스템 로그</span></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                        {logs.map((log, i) => (<div key={i} className={`py-1 border-b border-slate-900/50 ${log.includes('💎') || log.includes('🌙') ? 'text-yellow-300' : 'text-slate-300'}`}>{log}</div>))}
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      <Modal title="암호화폐 지갑" isOpen={activeModal === 'wallet'} onClose={() => setActiveModal(null)} Icon={DollarSign}>
        <div className="space-y-3" id="wallet-sell-buttons">
          {(Object.keys(COIN_TYPES) as Array<keyof typeof COIN_TYPES>).map((key) => {
            const coin = COIN_TYPES[key];
            const count = inventory[key];
            const CoinIcon = coin.icon;
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${coin.border} ${coin.bg}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/30 rounded-md">
                        <CoinIcon className={`w-5 h-5 ${coin.color}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-bold ${coin.color}`}>{coin.name}</span>
                        <span className="text-[10px] text-slate-400 opacity-70">{coin.sellable ? `가치: ${coin.value.toLocaleString()} KRW` : '판매 불가'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xl font-mono font-bold">{count}</span>
                    {coin.sellable && (
                        <button onClick={() => sellCoin(key)} disabled={count === 0} className={`px-3 py-1 rounded text-xs font-bold transition-all ${count > 0 ? 'bg-white text-black hover:scale-105' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>판매</button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
        <button id="sell-all-btn" onClick={sellAll} className="w-full mt-4 text-sm bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-2 rounded border border-emerald-800 transition-colors">모두 판매 (판매 가능 코인만)</button>
      </Modal>

      <Modal title="연구소 (Lab)" isOpen={activeModal === 'lab'} onClose={() => setActiveModal(null)} Icon={FlaskConical}>
        <div className="flex space-x-2 mb-4 border-b border-slate-700 pb-2">
             <button 
                onClick={() => setLabTab('resource')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${labTab === 'resource' ? 'bg-pink-900/40 text-pink-300' : 'hover:bg-slate-800 text-slate-500'}`}
             >
                 차원 채굴기
             </button>
             <button 
                onClick={() => setLabTab('code')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${labTab === 'code' ? 'bg-emerald-900/40 text-emerald-300' : 'hover:bg-slate-800 text-slate-500'}`}
             >
                 코드 실행기
             </button>
        </div>

        {labTab === 'resource' && (
            <div className="space-y-6 animate-slide-up-fade">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                    <h3 className="text-lg font-bold text-pink-400 mb-2 flex items-center justify-center gap-2"><Pickaxe /> 차원 채굴기</h3>
                    <p className="text-sm text-slate-400 mb-4">차원 에너지를 사용하여 <strong>마법석</strong>을 <strong>실시간으로</strong> 채굴합니다.</p>
                    
                    <div className="bg-black/40 p-4 rounded-lg mb-4 font-mono text-sm space-y-1 text-left">
                        <p className={resourceMinerLevel >= 1 ? "text-green-400" : "text-slate-600"}>• 1차원: 4초당 10% (1개) {resourceMinerLevel >= 1 && "✓"}</p>
                        <p className={resourceMinerLevel >= 2 ? "text-green-400" : "text-slate-600"}>• 2차원: 4초당 15% (1개), 8초당 2% (2개) {resourceMinerLevel >= 2 && "✓"}</p>
                        <p className={resourceMinerLevel >= 3 ? "text-green-400" : "text-slate-600"}>• 3차원: 4초당 20% (1개), 8초당 5% (2개) {resourceMinerLevel >= 3 && "✓"}</p>
                        <p className={resourceMinerLevel >= 4 ? "text-green-400" : "text-slate-600"}>• 4차원: 4초당 25% (1개), 6초당 8% (2개), 20초당 4% (3개) {resourceMinerLevel >= 4 && "✓"}</p>
                    </div>

                    <div className="mb-4"><p className="text-xs text-slate-500">현재 레벨</p><p className="text-2xl font-bold text-white">{resourceMinerLevel > 0 ? `${resourceMinerLevel}차원` : "미보유"}</p></div>

                    <button id="upgrade-resource-miner" onClick={upgradeResourceMiner} disabled={resourceMinerLevel >= 4} className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${resourceMinerLevel >= 4 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/20'}`}>
                        {resourceMinerLevel === 0 && "구매 (20 LUNAR)"}
                        {resourceMinerLevel === 1 && "강화 (10 마법석)"}
                        {resourceMinerLevel === 2 && "강화 (20 마법석)"}
                        {resourceMinerLevel === 3 && "강화 (50 마법석)"}
                        {resourceMinerLevel === 4 && "최고 레벨"}
                    </button>
                </div>
            </div>
        )}

        {labTab === 'code' && (
             <div className="space-y-6 animate-slide-up-fade">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                    <h3 className="text-lg font-bold text-emerald-400 mb-2 flex items-center justify-center gap-2"><Database /> 코드 실행기</h3>
                    <p className="text-sm text-slate-400 mb-4">복잡한 연산을 통해 <strong>데이터 결정</strong>을 생성합니다.</p>
                    
                    <div className="bg-black/40 p-4 rounded-lg mb-4 font-mono text-sm space-y-1 text-left">
                        <p className={codeExecutorLevel >= 1 ? "text-green-400" : "text-slate-600"}>• 1티어: 5초당 10% (1개) {codeExecutorLevel >= 1 && "✓"}</p>
                        <p className={codeExecutorLevel >= 2 ? "text-green-400" : "text-slate-600"}>• 2티어: 5초당 15%, 성공시 20%로 2개 {codeExecutorLevel >= 2 && "✓"}</p>
                        <p className={codeExecutorLevel >= 3 ? "text-green-400" : "text-slate-600"}>• 3티어: 5초당 20%, 성공시 40%로 2개 {codeExecutorLevel >= 3 && "✓"}</p>
                    </div>

                    <div className="mb-4"><p className="text-xs text-slate-500">현재 레벨</p><p className="text-2xl font-bold text-white">{codeExecutorLevel > 0 ? `${codeExecutorLevel}티어` : "미보유"}</p></div>

                    <button id="upgrade-code-executor" onClick={upgradeCodeExecutor} disabled={codeExecutorLevel >= 3} className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${codeExecutorLevel >= 3 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}>
                        {codeExecutorLevel === 0 && "설치 (5 DIGITAL)"}
                        {codeExecutorLevel === 1 && "업그레이드 (10 DIGITAL, 5 결정)"}
                        {codeExecutorLevel === 2 && "업그레이드 (20 DIGITAL, 20 결정)"}
                        {codeExecutorLevel === 3 && "최고 레벨"}
                    </button>
                    <div className="text-xs text-slate-500 mt-2 flex justify-center gap-3">
                        <span>보유 DIGITAL: {inventory.DIGITAL}</span>
                        <span>보유 결정: {inventory.DATA_CRYSTAL}</span>
                    </div>
                </div>
            </div>
        )}
      </Modal>

      <Modal title="일반 상점" isOpen={activeModal === 'general_store'} onClose={() => setActiveModal(null)} Icon={Home}>
        <div className="flex space-x-2 mb-4 border-b border-slate-700 pb-2">
             <button 
                onClick={() => setStoreTab('items')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${storeTab === 'items' ? 'bg-lime-900/40 text-lime-300' : 'hover:bg-slate-800 text-slate-500'}`}
             >
                 아이템
             </button>
             <button 
                id="totem-store-tab"
                onClick={() => setStoreTab('totems')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${storeTab === 'totems' ? 'bg-purple-900/40 text-purple-300' : 'hover:bg-slate-800 text-slate-500'}`}
             >
                 토템
             </button>
        </div>

        {storeTab === 'items' && (
            <div className="space-y-3">
                {GENERAL_STORE_ITEMS.map((item) => {
                    const isOwned = ownedItems[item.id as keyof typeof ownedItems];
                    const canAfford = money >= item.cost;
                    return (
                    <button key={item.id} onClick={() => buyGeneralItem(item)} disabled={!canAfford || isOwned} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${isOwned? 'bg-slate-900 border-lime-800 opacity-60': canAfford? 'bg-slate-800 border-slate-700 hover:border-lime-500 hover:bg-slate-750': 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${!isOwned && canAfford ? 'bg-slate-700 group-hover:bg-lime-900/30' : 'bg-slate-800'}`}><item.icon className={`w-5 h-5 ${isOwned ? 'text-lime-400' : (!canAfford ? 'text-slate-600' : 'text-slate-300 group-hover:text-lime-400')}`} /></div>
                            <div><p className="font-bold text-slate-200">{item.name}</p><p className="text-xs text-slate-400">{item.description}</p></div>
                        </div>
                        <div className="text-right">{isOwned ? <p className="font-bold text-lime-400">보유중</p> : <p className={`font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>{item.cost.toLocaleString()} <span className="text-xs text-slate-500">KRW</span></p>}</div>
                    </button>
                    );
                })}
                <button onClick={sleep} disabled={!ownedItems.bed || !ownedItems.clock || gameTime.hour < 21 || weather === '눈'} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border bg-slate-800 border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:border-purple-500 hover:enabled:bg-slate-750 transition-all text-purple-400 disabled:text-slate-600">
                    <Bed size={16}/> {weather === '눈' ? '취침 불가 (추위)' : (gameTime.hour < 21 ? '취침 불가 (21시 이후)' : '잠자기')}
                </button>
            </div>
        )}
        {storeTab === 'totems' && (
            <div className="space-y-3">
                <TotemShopContent gameState={gameState} buyTotem={buyTotem} currentTime={currentTime} />
            </div>
        )}
      </Modal>

      <Modal title="하드웨어 상점" isOpen={activeModal === 'hardware_store'} onClose={() => setActiveModal(null)} Icon={ShoppingCart}>
        <div className="space-y-3">
            {COMPUTERS.map((comp) => {
                const costLabel = comp.costType === 'MONEY' ? 'KRW' : (comp.costType === 'DATA_CRYSTAL' ? '결정' : '');
                let canAfford = false;
                if (comp.costType === 'MONEY') canAfford = money >= comp.cost;
                else if (comp.costType === 'DATA_CRYSTAL') canAfford = inventory.DATA_CRYSTAL >= comp.cost;

                const atMaxComputers = myComputers.length >= MAX_COMPUTERS;
                const costColor = canAfford ? (comp.costType === 'DATA_CRYSTAL' ? 'text-emerald-400' : 'text-emerald-400') : 'text-red-400';
                
                return (
                  <button key={comp.id} id={comp.id === 'tier1' ? 'buy-tier1' : undefined} onClick={() => buyComputer(comp)} disabled={!canAfford || atMaxComputers} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${canAfford && !atMaxComputers ? 'bg-slate-800 border-slate-700 hover:border-orange-500 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${canAfford && !atMaxComputers ? 'bg-slate-700 group-hover:bg-orange-900/30' : 'bg-slate-800'}`}><comp.icon className={`w-5 h-5 ${canAfford && !atMaxComputers ? 'text-slate-300 group-hover:text-orange-400' : 'text-slate-600'}`} /></div>
                        <div>
                            <p className="font-bold text-slate-200">{comp.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{comp.desc}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-mono font-bold ${costColor}`}>{comp.cost.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{costLabel}</p>
                    </div>
                  </button>
                );
            })}
            <div className="text-xs text-center text-slate-500 pt-2 border-t border-slate-800">
                보유 재화: {money.toLocaleString()} KRW / {inventory.DATA_CRYSTAL} 결정
            </div>
        </div>
      </Modal>
      
      <Modal title="날씨 도감" isOpen={activeModal === 'almanac'} onClose={() => setActiveModal(null)} Icon={BookOpen}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(WEATHER_EFFECTS).map(([key, weatherInfo]) => {
                const isDiscovered = experiencedWeather.includes(key as WeatherType);
                const Icon = isDiscovered ? weatherInfo.icon : HelpCircle;
                return (
                    <div key={key} className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${isDiscovered ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-900 border-slate-800'}`}>
                        <Icon className={`w-8 h-8 mb-2 ${isDiscovered ? weatherInfo.color : 'text-slate-600'}`} />
                        <p className={`font-bold text-sm ${isDiscovered ? 'text-slate-200' : 'text-slate-500'}`}>{isDiscovered ? weatherInfo.name : '???'}</p>
                        <p className="text-xs text-slate-400 mt-1">{isDiscovered ? weatherInfo.description : '아직 발견되지 않음'}</p>
                    </div>
                );
            })}
        </div>
      </Modal>

      <Modal title="설정" isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} Icon={Settings}>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="notifications-toggle" className="font-bold text-slate-200">게임 내 알림</label>
                <button
                    id="notifications-toggle"
                    onClick={() => updateGameState({ settings: { ...settings, notifications: !settings.notifications } })}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.notifications ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
            </div>
        </div>
      </Modal>

      {/* Bottom Nav */}
      <BottomNav onOpenModal={handleOpenModal} onSignOut={handleSignOut} money={money} ownedItems={ownedItems} advancedTutorialStep={advancedTutorialStep} />

      <style>{`
        :root { --toast-translate-y: 100%; --toast-opacity: 0; }
        .toast-enter { --toast-translate-y: 0; --toast-opacity: 1; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        @keyframes mining-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-mining-bar { animation: mining-bar 1s infinite linear; }
        @keyframes ping-slow { 75%, 100% { transform: scale(2); opacity: 0; } }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .snowflake { position: absolute; width: 10px; height: 10px; background: white; border-radius: 50%; opacity: 0.6; animation: fall linear infinite; }
        @keyframes fall { 0% { transform: translateY(-10vh) translateX(0); } 100% { transform: translateY(110vh) translateX(5vw); } }
        ${Array.from({ length: 50 }).map((_, i) => `.snowflake:nth-child(${i}) { left: ${Math.random() * 100}vw; animation-duration: ${Math.random() * 5 + 5}s; animation-delay: ${Math.random() * 5}s; transform: scale(${Math.random() * 0.5 + 0.5}); }`).join('\n')}
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px 5px rgba(52, 211, 153, 0.7); } 50% { box-shadow: 0 0 30px 10px rgba(52, 211, 153, 0.3); } }
        .tutorial-highlight-circle { animation: pulse-glow 2s infinite; border-radius: 9999px; }
        .tutorial-highlight-border { animation: pulse-glow 2s infinite; border-radius: 0.75rem; }
      `}</style>
    </div>
  );
};

// --- 자식 컴포넌트 ---
const MiningProgress = ({ startTime, duration, isPaused, currentTime }: { startTime: number, duration: number, isPaused: boolean, currentTime: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isPaused) return;
        
        const elapsed = currentTime - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

    }, [startTime, duration, isPaused, currentTime]);

    return (
        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%`, transition: progress < 5 ? 'none' : 'width 0.1s linear' }} />
    );
};

const TotemShopContent = ({ gameState, buyTotem, currentTime }: { gameState: GameState, buyTotem: (totem: any) => void, currentTime: number }) => {
    const { inventory, totemStock, nextTotemRestockTime, season, gameTime } = gameState;

    const timeRemaining = Math.max(0, Math.floor((nextTotemRestockTime - currentTime) / 1000));
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const availableTotems = TOTEMS.filter(totem => totemStock[totem.id]);
    const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
    const currentTimeOfDay = isNight ? 'night' : 'day';

    return (
        <>
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center font-mono">
                <p className="text-slate-400 text-xs">다음 재고 변경까지</p>
                <p className="text-xl font-bold text-white">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
            </div>
            <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded mb-2 text-xs text-purple-300 text-center">
                토템은 <strong>마법석</strong>으로 즉시 소환하여 보상을 얻습니다. 현재 <strong>계절과 시간</strong>에 맞는 토템만 소환할 수 있습니다.
            </div>

            {availableTotems.length > 0 ? availableTotems.map((totem) => {
                const canAfford = inventory.MAGIC_STONE >= totem.cost;
                const isCorrectSeason = totem.seasons.includes(season);
                const isCorrectTime = totem.time === 'any' || totem.time === currentTimeOfDay;
                const isDisabled = !canAfford || !isCorrectSeason || !isCorrectTime;

                const seasonText = totem.seasons.length >= 4 ? '모든 계절' : totem.seasons.join(', ');
                const timeText = totem.time === 'day' ? '낮' : totem.time === 'night' ? '밤' : '항시';

                return (
                    <div key={totem.id} className={`flex flex-col p-3 rounded-lg border transition-all ${isDisabled ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-900"><Pyramid className={`w-5 h-5 ${!isDisabled ? 'text-purple-400' : 'text-slate-600'}`} /></div>
                                <div>
                                    <p className={`font-bold ${!isDisabled ? 'text-slate-200' : 'text-slate-500'}`}>{totem.name}</p>
                                    <p className="text-[10px] text-slate-400">조건: {seasonText} {timeText} / 비용: {totem.cost} 마법석</p>
                                </div>
                            </div>
                            <button onClick={() => buyTotem(totem)} disabled={isDisabled} className={`px-4 py-2 rounded text-xs font-bold transition-all ${!isDisabled ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                                소환
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50">{totem.description}</p>
                    </div>
                )
            }) : (
                 <div className="text-center text-slate-500 p-8">
                    <p>현재 구매 가능한 토템이 없습니다.</p>
                    <p className="text-xs">다음 재고 변경 시간을 기다려주세요.</p>
                 </div>
            )}
        </>
    )
}

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = '오류가 발생했습니다.';
      switch (err.code) {
        case 'auth/invalid-email': message = '유효하지 않은 이메일 주소입니다.'; break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': message = '이메일 또는 비밀번호가 일치하지 않습니다.'; break;
        case 'auth/email-already-in-use': message = '이미 사용 중인 이메일입니다.'; break;
        case 'auth/weak-password': message = '비밀번호는 6자 이상이어야 합니다.'; break;
        default: message = `인증에 실패했습니다: ${err.code}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-pan-background" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
            <Terminal className="w-10 h-10 text-emerald-400" />
            암호화폐 채굴 타이쿤
          </h1>
          <p className="text-slate-400 mt-2">클라우드 저장 기능으로 어디서든 당신의 제국을 건설하세요.</p>
        </div>

        <div className="w-full max-w-md space-y-6 bg-slate-900/50 backdrop-blur-lg p-8 rounded-xl border border-slate-800 shadow-2xl animate-slide-up-fade">
          <h2 className="text-2xl font-bold text-center text-slate-200">{isSignUp ? '새 계정 만들기' : '로그인'}</h2>
          
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all" />
          </div>

          {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
          
          <button onClick={handleAuth} disabled={loading || !email || !password} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-emerald-500 transition-all disabled:bg-slate-700 disabled:cursor-not-allowed transform active:scale-95">
            {loading ? <LoaderCircle className="animate-spin w-5 h-5" /> : (isSignUp ? '회원가입' : '로그인')}
          </button>

           <p className="text-center text-sm text-slate-400">
             {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
             <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-medium text-emerald-400 hover:text-emerald-300 ml-2 focus:outline-none focus:underline">
               {isSignUp ? '로그인' : '회원가입'}
             </button>
           </p>
        </div>
      </div>
      <style>{`
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 2rem 2rem;
        }
        @keyframes pan-background {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        .animate-pan-background { animation: pan-background 90s linear infinite; }
        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade { animation: slide-up-fade 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
    </div>
  );
};


const BottomNav = ({ onOpenModal, onSignOut, money, ownedItems, advancedTutorialStep }: { onOpenModal: (modal: string) => void, onSignOut: () => void, money: number, ownedItems: GameState['ownedItems'], advancedTutorialStep: number }) => {
    const isLabHighlighted = advancedTutorialStep === 2 || advancedTutorialStep === 5;
    const isTotemStoreHighlighted = advancedTutorialStep === 8;
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 flex justify-around items-center p-2 z-40 overflow-x-auto custom-scrollbar">
            <button id="nav-wallet" onClick={() => onOpenModal('wallet')} className="flex flex-col items-center text-emerald-400 p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center">
            <Wallet size={20} />
            <span className="text-[10px] mt-1 font-mono truncate w-full">{money.toLocaleString()}</span>
            </button>
            <button id="nav-hardware" onClick={() => onOpenModal('hardware_store')} className="flex flex-col items-center text-orange-400 p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center">
            <ShoppingCart size={20} />
            <span className="text-[10px] mt-1">하드웨어</span>
            </button>
            <button onClick={() => onOpenModal('general_store')} className={`flex flex-col items-center p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center transition-all ${isTotemStoreHighlighted ? 'animate-pulse bg-purple-500/20 text-purple-300' : 'text-lime-400'}`}>
            <Home size={20} />
            <span className="text-[10px] mt-1">일반상점</span>
            </button>
            <button id="nav-lab" onClick={() => onOpenModal('lab')} className={`flex flex-col items-center p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center transition-all ${isLabHighlighted ? 'animate-pulse bg-pink-500/20 text-pink-300' : 'text-pink-400'}`}>
            <FlaskConical size={20} />
            <span className="text-[10px] mt-1">연구소</span>
            </button>
            <button id="nav-almanac" onClick={() => onOpenModal('almanac')} disabled={!ownedItems.almanac} title={!ownedItems.almanac ? "일반 상점에서 구매 필요" : "날씨 도감"} className="flex flex-col items-center text-sky-400 p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center disabled:opacity-50 disabled:cursor-not-allowed">
            <BookOpen size={20} />
            <span className="text-[10px] mt-1">날씨도감</span>
            </button>
            <button onClick={() => onOpenModal('settings')} className="flex flex-col items-center text-slate-400 p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center">
            <Settings size={20} />
            <span className="text-[10px] mt-1">설정</span>
            </button>
            <button onClick={onSignOut} className="flex flex-col items-center text-red-400 p-2 rounded-lg hover:bg-slate-800 min-w-[70px] text-center">
            <LogOut size={20} />
            <span className="text-[10px] mt-1">나가기</span>
            </button>
        </nav>
    );
};

const Modal: React.FC<{ title: string; isOpen: boolean; onClose: () => void; Icon: React.ElementType, children?: React.ReactNode }> = ({ title, isOpen, onClose, children, Icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2"><Icon className="text-slate-400" />{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
        </header>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: ToastType[], onRemove: (id: number) => void }) => (
    <div className="fixed top-4 right-4 z-[200] space-y-2 w-72 pointer-events-none">
        {toasts.map(toast => {
            const colors = {
                info: 'bg-blue-900/90 border-blue-700 text-blue-300',
                success: 'bg-green-900/90 border-green-700 text-green-300',
                warning: 'bg-yellow-900/90 border-yellow-700 text-yellow-300',
                error: 'bg-red-900/90 border-red-700 text-red-300',
            };
            const Icon = toast.icon;
            return (
                <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-toast-in backdrop-blur-md ${colors[toast.type]}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                    <button onClick={() => onRemove(toast.id)} className="-mr-1 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            );
        })}
        <style>{`
      @keyframes toast-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
    `}</style>
    </div>
);

const Highlight = ({ selector, type, step }: { selector: string, type: 'circle' | 'border', step: number }) => {
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const targetRef = useRef<Element | null>(null);
  
    useEffect(() => {
      const updatePosition = () => {
        const el = document.querySelector(selector);
        if (el) {
          targetRef.current = el;
          const rect = el.getBoundingClientRect();
          let newStyle: React.CSSProperties = {
            position: 'fixed',
            transition: 'all 0.3s ease-out',
            pointerEvents: 'none',
            zIndex: 99,
          };
          if (type === 'circle') {
            const size = Math.max(rect.width, rect.height) + 40;
            newStyle = {
              ...newStyle,
              top: rect.top + rect.height / 2,
              left: rect.left + rect.width / 2,
              width: size,
              height: size,
              transform: 'translate(-50%, -50%)',
            };
          } else { // border
            newStyle = {
              ...newStyle,
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
            };
          }
          setStyle(newStyle);
        }
      };
      
      updatePosition();
      const interval = setInterval(updatePosition, 200);
      return () => clearInterval(interval);

    }, [selector, type, step]);
  
    return <div style={{...style, opacity: 1}} className={type === 'circle' ? 'tutorial-highlight-circle' : 'tutorial-highlight-border'}></div>;
};

const AdvancedTutorial = ({ step, gameState }: { step: number; gameState: GameState }) => {
    const { inventory } = gameState;
    const steps = [
        null, // 0
        { text: "LUNAR 20개를 모아 연구소를 잠금 해제하세요.", target: 20, current: inventory.LUNAR, icon: Moon, highlight: null },
        { text: "목표 달성! 하단의 '연구소' 탭을 열어주세요.", icon: FlaskConical, highlight: { selector: '#nav-lab', type: 'circle' } },
        { text: "차원 채굴기를 구매하여 마법석 채굴을 시작하세요.", icon: Pickaxe, highlight: { selector: '#upgrade-resource-miner', type: 'border' } },
        { text: "DIGITAL 5개를 모아 코드 실행기를 잠금 해제하세요.", target: 5, current: inventory.DIGITAL, icon: Binary, highlight: null },
        { text: "목표 달성! '연구소'에서 코드 실행기를 설치하세요.", icon: FlaskConical, highlight: { selector: '#nav-lab', type: 'circle' } },
        { text: "코드 실행기를 설치하여 데이터 결정을 생성하세요.", icon: Database, highlight: { selector: '#upgrade-code-executor', type: 'border' } },
        { text: "마법석을 5개 이상 채굴하여 토템 상점을 발견하세요.", target: 5, current: inventory.MAGIC_STONE, icon: Gem, highlight: null },
        { text: "새로운 기능 잠금 해제! '일반 상점'의 '토템' 탭을 확인하세요.", icon: Home, highlight: { selector: '#totem-store-tab', type: 'border' } },
        { text: "고급 튜토리얼 완료! 이제 자유롭게 플레이하세요.", icon: CheckCircle, highlight: null }
    ] as const;

    const currentStep = steps[step];
    if (!currentStep) return null;

    const Icon = currentStep.icon;
    const progress = currentStep.target ? (currentStep.current / currentStep.target) * 100 : 0;

    return (
        <div className="fixed top-5 left-5 z-[100] pointer-events-none">
            {currentStep.highlight && <Highlight selector={currentStep.highlight.selector} type={currentStep.highlight.type} step={step} />}
            <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-lg border border-amber-500 shadow-lg max-w-sm pointer-events-auto w-72 animate-slide-up-fade">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-full border border-amber-600"><Target className="w-5 h-5 text-amber-400" /></div>
                    <div>
                        <p className="text-xs font-bold text-amber-400">다음 목표</p>
                        <p className="text-sm font-semibold">{currentStep.text}</p>
                    </div>
                </div>
                {currentStep.target && (
                    <div className="mt-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="flex items-center gap-1 font-mono text-slate-300"><Icon size={12} /> 진행도</span>
                            <span>{Math.min(currentStep.current, currentStep.target)} / {currentStep.target}</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
  
const Tutorial = ({ step, setStep, completeTutorial }: { step: number, setStep: (step: number) => void, completeTutorial: () => void }) => {
    const tutorialSteps = [
      { text: "채굴 타이쿤에 오신 것을 환영합니다! 이 튜토리얼이 게임의 기본을 안내해 드립니다.", highlight: null },
      { text: "먼저, 채굴을 시작하기 위해 컴퓨터가 필요합니다. 하단의 '하드웨어' 상점을 열어 첫 PC를 구매해 보세요.", highlight: { selector: '#nav-hardware', type: 'circle' } },
      { text: "훌륭합니다! 목록의 첫 번째 PC인 '스타터 PC'를 구매하세요.", highlight: { selector: '#buy-tier1', type: 'border' } },
      { text: "잘하셨어요! 이제 채굴이 자동으로 시작됩니다. 채굴된 코인은 '지갑'에서 확인할 수 있습니다. 지갑을 열어보세요.", highlight: { selector: '#nav-wallet', type: 'circle' } },
      { text: "코인이 모이면 판매하여 돈을 벌 수 있습니다. '모두 판매' 버튼을 눌러 코인을 판매하세요.", highlight: { selector: '#sell-all-btn', type: 'border' } },
      { text: "이제 모든 준비가 끝났습니다! 최고의 장비로 업그레이드하고, 날씨 변화에 대응하며 최고의 채굴왕이 되어보세요!", highlight: null },
    ] as const;
  
    const currentStep = tutorialSteps[step - 1];
    if (!currentStep) return null;
  
    const nextStep = () => {
      if (step >= tutorialSteps.length) {
        setStep(0);
        completeTutorial();
      } else if (step === 1) {
         setStep(step + 1);
      }
    };
  
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none">
          {currentStep.highlight && <Highlight selector={currentStep.highlight.selector} type={currentStep.highlight.type} step={step} />}
          <div className="absolute top-5 left-5 bg-slate-800 p-6 rounded-lg border border-emerald-500 shadow-lg max-w-sm text-center pointer-events-auto">
             <div className="absolute -top-4 -left-4 bg-emerald-500 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">{step}</div>
              <p className="text-lg">{currentStep.text}</p>
              {(step === 1 || step === 6) && (
                <button onClick={nextStep} className="mt-4 bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors">
                  {step === 6 ? "게임 시작!" : "다음"}
                </button>
              )}
          </div>
      </div>
    );
  };

const root = createRoot(document.getElementById("root")!);
root.render(<App />);