
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Cpu, Zap, ShoppingCart, Wallet, Server, Terminal, DollarSign, Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, Rainbow, Wifi, WifiOff, Moon, Star, Wind, Snowflake, AlertTriangle, Home, Clock, Bed, LogOut, X, LoaderCircle, CheckCircle, Info, Flame } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
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
  CUBE: { name: 'CUBE', value: 10000, ratePerTier: 0.025, color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/30' },
  LUNAR: { name: 'LUNAR', value: 20000, ratePerTier: 0.020, color: 'text-gray-200', border: 'border-gray-300', bg: 'bg-gray-800/50' },
  ENERGY: { name: 'ENERGY', value: 50000, ratePerTier: 0.015, color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-900/30' },
  PRISM: { name: 'PRISM', value: 100000, ratePerTier: 0.010, color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/30' },
};
const COMPUTERS = [
  { id: 'tier1', name: '스타터 PC', tier: 1, cost: 50000, icon: Cpu },
  { id: 'tier2', name: '게이머 PC', tier: 2, cost: 150000, icon: Server },
  { id: 'tier3', name: '프로 채굴기', tier: 3, cost: 400000, icon: Zap },
];
const ALL_COMPUTERS = [ ...COMPUTERS, { id: 'tier4', name: '퀀텀 슈퍼컴', tier: 4, cost: 1000000, icon: CloudLightning } ];
const GENERAL_STORE_ITEMS = [
    { id: 'clock', name: '디지털 시계', cost: 10000, description: '시간과 날짜를 표시합니다. 수면의 필수 조건입니다.', icon: Clock },
    { id: 'bed', name: '침대', cost: 50000, description: '21:00 이후 다음 날 8:00로 시간을 건너뜁니다.', icon: Bed },
];
type Season = '봄' | '여름' | '가을' | '겨울';
type WeatherType = '맑음' | '구름' | '비' | '천둥' | '산성비' | '무지개' | '황사' | '폭염' | '폭우' | '눈' | '별똥별' | '우박' | '오로라' | '블루문';
const WEATHER_EFFECTS: { [key in WeatherType]: { name: string, icon: React.ElementType, color: string } } = {
  '맑음': { name: '맑음', icon: Sun, color: 'text-yellow-400' }, '구름': { name: '구름', icon: Cloud, color: 'text-slate-400' }, '비': { name: '비', icon: CloudRain, color: 'text-blue-400' }, '천둥': { name: '천둥', icon: CloudLightning, color: 'text-indigo-400' }, '산성비': { name: '산성비', icon: CloudDrizzle, color: 'text-lime-500' }, '무지개': { name: '무지개', icon: Rainbow, color: 'text-pink-400' }, '황사': { name: '황사', icon: Wind, color: 'text-amber-500' }, '폭염': { name: '폭염', icon: Flame, color: 'text-red-500' }, '폭우': { name: '폭우', icon: CloudRain, color: 'text-blue-600' }, '눈': { name: '눈', icon: Snowflake, color: 'text-cyan-300' }, '별똥별': { name: '별똥별', icon: Star, color: 'text-yellow-300' }, '우박': { name: '우박', icon: AlertTriangle, color: 'text-gray-400' }, '오로라': { name: '오로라', icon: Rainbow, color: 'text-teal-400' }, '블루문': { name: '블루문', icon: Moon, color: 'text-blue-300' },
};
const SEASONS: Season[] = ['봄', '여름', '가을', '겨울'];

// --- 타입 정의 ---
interface GameState {
  money: number;
  inventory: { CUBE: number; LUNAR: number; ENERGY: number; PRISM: number; };
  myComputers: Array<{ instanceId: number; typeId: string; tier: number; name: string; }>;
  logs: string[];
  weather: WeatherType;
  internetOnline: boolean;
  gameTime: { day: number; hour: number; minute: number; };
  season: Season;
  ownedItems: { clock: boolean; bed: boolean; };
  stoppedMiners: Array<[number, number]>; // Map은 JSON 직렬화가 어려워 배열로 변경
  tutorialCompleted: boolean;
}
type ToastType = { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error'; icon: React.ElementType };

// --- 초기 게임 상태 ---
const initialGameState: GameState = {
  money: 100000, inventory: { CUBE: 0, LUNAR: 0, ENERGY: 0, PRISM: 0 }, myComputers: [], logs: ["게임에 오신 것을 환영합니다!"], weather: '맑음', internetOnline: true, gameTime: { day: 1, hour: 9, minute: 0 }, season: '봄', ownedItems: { clock: false, bed: false }, stoppedMiners: [], tutorialCompleted: false,
};

// --- 유틸리티 훅 ---
const useDebouncedEffect = (effect: () => void, deps: any[], delay: number) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
};

// --- 주 앱 컴포넌트 ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [tutorialStep, setTutorialStep] = useState(0);

  const { money, inventory, myComputers, logs, weather, internetOnline, gameTime, season, ownedItems, stoppedMiners, tutorialCompleted } = gameState;
  const isTutorialActive = !tutorialCompleted && tutorialStep > 0;

  const lastWeather = useRef<WeatherType>('맑음');
  const consecutiveClear = useRef(0);
  const miningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((message: string, type: ToastType['type'] = 'info') => {
    const icons = { info: Info, success: CheckCircle, warning: AlertTriangle, error: Flame };
    const newToast: ToastType = { id: Date.now(), message, type, icon: icons[type] };
    setToasts(prev => [newToast, ...prev]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
    }, 4000);
  }, []);

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...newState }));
  }, []);

  const addLog = useCallback((msg: string) => {
    const timeString = ownedItems.clock ? `${gameTime.day}일 ${String(gameTime.hour).padStart(2, '0')}:${String(gameTime.minute).padStart(2, '0')}` : new Date().toLocaleTimeString();
    updateGameState({ logs: [`[${timeString}] ${msg}`, ...logs].slice(0, 50) });
  }, [gameTime, ownedItems.clock, logs, updateGameState]);

  // --- Firebase 연동 ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedState = { ...initialGameState, ...docSnap.data() };
          // Firestore는 Map을 지원하지 않으므로 배열을 Map으로 변환
          setGameState({
            ...loadedState,
            stoppedMiners: loadedState.stoppedMiners || [], // Ensure it's an array
          });
          if (!loadedState.tutorialCompleted) {
              setTutorialStep(1);
          }
        } else {
          setGameState(initialGameState);
          setTutorialStep(1);
        }
      } else {
        setUser(null);
        setGameState(initialGameState);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useDebouncedEffect(() => {
    if (user && !loading) {
      const stateToSave = { ...gameState };
      setDoc(doc(db, "users", user.uid), stateToSave);
    }
  }, [gameState, user, loading], 1500);

  const handleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleSignOut = () => {
    signOut(auth);
    addToast("로그아웃되었습니다.", "success");
  };

  const isNight = gameTime.hour >= 20 || gameTime.hour < 9;

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
                      if ((day - 1) % 3 === 0 && day > 1) {
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

  const mine = useCallback(() => {
    if (myComputers.length === 0) return;
    const stoppedMinersMap = new Map(stoppedMiners);

    myComputers.forEach(comp => {
      if (stoppedMinersMap.has(comp.instanceId)) return;

      (Object.keys(COIN_TYPES) as Array<keyof typeof COIN_TYPES>).forEach(coinKey => {
        const coin = COIN_TYPES[coinKey];
        let chance = comp.tier * coin.ratePerTier;

        switch(weather) {
            case '비': if(coinKey === 'CUBE') chance += comp.tier * 0.0025; break;
            case '천둥': if(coinKey === 'ENERGY') chance += comp.tier * 0.0015; break;
            case '산성비': chance *= 0.8; break;
            case '무지개': chance *= 1.05; break;
            case '폭우': if(coinKey === 'CUBE') chance += comp.tier * 0.005; break;
            case '별똥별': chance *= 1.1; break;
            case '우박': chance *= 0.8; break;
            case '오로라': chance *= 1.2; break;
        }
        
        if (Math.random() < chance) {
          updateGameState({ inventory: { ...inventory, [coinKey]: inventory[coinKey] + 1 } });
          if (coinKey === 'PRISM' || coinKey === 'ENERGY') {
            addLog(`🎉 ${comp.name}에서 희귀한 ${coinKey} 발견!`);
            addToast(`${coinKey} 발견!`, 'success');
          }
        }
      });
    });
  }, [myComputers, weather, addLog, addToast, inventory, stoppedMiners, updateGameState]);
  
  // --- 채굴 & 날씨 & 효과 루프 (상태에 의존하도록 수정) ---
  useEffect(() => {
    if (miningTimeoutRef.current) clearTimeout(miningTimeoutRef.current);
    const scheduleMine = () => {
        if (!internetOnline || myComputers.length === 0) {
            miningTimeoutRef.current = setTimeout(scheduleMine, 1000);
            return;
        }
        let delay = 5000;
        if (weather === '황사') delay *= 1.2;
        if (weather === '폭우') delay *= 2;
        if (weather === '블루문') delay -= 2000;
        mine();
        miningTimeoutRef.current = setTimeout(scheduleMine, Math.max(500, delay));
    };
    scheduleMine();
    return () => { if (miningTimeoutRef.current) clearTimeout(miningTimeoutRef.current); };
  }, [mine, internetOnline, weather, myComputers.length]);

  useEffect(() => {
    const weatherInterval = setInterval(() => {
      let nextWeather: WeatherType;
      const rand = Math.random();

      if(isNight && rand < 0.1) {
        nextWeather = (season === '겨울' && Math.random() < 0.05) ? '오로라' : '별똥별';
      } else if ((['비', '산성비', '폭우'].includes(lastWeather.current)) && rand < 0.1) {
        nextWeather = '무지개';
      } else if (consecutiveClear.current >= 3 && rand < 0.1) {
        nextWeather = '블루문';
        consecutiveClear.current = 0;
      } else {
          let baseRand = Math.random();
          switch(season) {
              case '봄': if (baseRand < 0.15) { nextWeather = '황사'; } else if (baseRand < 0.55) nextWeather = '맑음'; else if (baseRand < 0.8) nextWeather = '구름'; else if (baseRand < 0.95) nextWeather = '비'; else nextWeather = '천둥'; break;
              case '여름': if (baseRand < 0.2) { nextWeather = '폭염'; } else if (baseRand < 0.3) nextWeather = '맑음'; else if (baseRand < 0.5) nextWeather = '구름'; else if (baseRand < 0.85) nextWeather = '비'; else nextWeather = '천둥'; break;
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
      
      if(nextWeather === '맑음') consecutiveClear.current++; else consecutiveClear.current = 0;
      updateGameState({ weather: nextWeather });
      lastWeather.current = nextWeather;
      addToast(`날씨가 ${WEATHER_EFFECTS[nextWeather].name}(으)로 변경`, 'info');
      
      if (!internetOnline) {
          updateGameState({ internetOnline: true });
          addToast("📡 인터넷 연결이 복구되었습니다.", "success");
      }
    }, 30000);
    return () => clearInterval(weatherInterval);
  }, [season, isNight, internetOnline, addToast, updateGameState]);

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

  // --- 액션 함수 ---
  const buyComputer = (computerType: typeof COMPUTERS[0]) => {
    if (money >= computerType.cost) {
      updateGameState({
        money: money - computerType.cost,
        myComputers: [...myComputers, { instanceId: Date.now() + Math.random(), typeId: computerType.id, tier: computerType.tier, name: computerType.name }]
      });
      addLog(`✅ ${computerType.name} 구매 완료`);
      if (isTutorialActive && tutorialStep === 2) setTutorialStep(3);
    }
  };

  const sellComputer = (instanceId: number) => {
    const computer = myComputers.find(c => c.instanceId === instanceId);
    const originalInfo = ALL_COMPUTERS.find(c => c.id === computer?.typeId);
    if (!computer || !originalInfo) return;
    const sellPrice = originalInfo.cost * 0.25;
    updateGameState({
        money: money + sellPrice,
        myComputers: myComputers.filter(c => c.instanceId !== instanceId)
    });
    addLog(`💻 ${computer.name} 판매, ${sellPrice.toLocaleString()} KRW 획득`);
  };
  
  const buyGeneralItem = (item: typeof GENERAL_STORE_ITEMS[0]) => {
      if (money >= item.cost && !ownedItems[item.id as keyof typeof ownedItems]) {
          updateGameState({
              money: money - item.cost,
              ownedItems: { ...ownedItems, [item.id]: true }
          });
          addLog(`🛍️ ${item.name} 구매 완료!`);
      }
  };

  const sleep = () => {
    if(ownedItems.bed && isNight && gameTime.hour >= 21 && weather !== '눈') {
        const nextDay = gameTime.day + 1;
        let newSeason = season;
        if ((nextDay - 1) % 3 === 0) {
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
    const count = inventory[type];
    if (count > 0) {
      const value = count * COIN_TYPES[type].value;
      updateGameState({
          inventory: { ...inventory, [type]: 0 },
          money: money + value
      });
      addLog(`💰 ${count} ${type} 판매, ${value.toLocaleString()} KRW 획득`);
      if(isTutorialActive && tutorialStep === 4) setTutorialStep(5);
    }
  };

  const sellAll = () => {
    let totalValue = Object.values(COIN_TYPES).reduce((acc, coin) => {
        return acc + (inventory[coin.name as keyof typeof inventory] * coin.value);
    }, 0);
    if (totalValue > 0) {
      updateGameState({
        inventory: { CUBE: 0, LUNAR: 0, ENERGY: 0, PRISM: 0 },
        money: money + totalValue
      });
      addLog(`💰 모든 코인 판매, ${totalValue.toLocaleString()} KRW 획득`);
    }
  };
  
  // --- 렌더링 로직 ---
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><LoaderCircle className="animate-spin w-10 h-10" /></div>;
  if (!user) return <LoginScreen onSignIn={handleSignIn} />;

  const CurrentWeatherIcon = WEATHER_EFFECTS[weather].icon;
  const stoppedMinersMap = new Map(stoppedMiners);
  
  const ScreenEffect = () => {
    switch (weather) {
      case '황사': return <div className="fixed inset-0 bg-yellow-600/10 backdrop-blur-[1px] pointer-events-none z-50"></div>;
      case '폭염': return <div className="fixed inset-0 bg-red-700/5 pointer-events-none z-50 animate-pulse-slow"></div>;
      case '눈': return <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">{Array.from({ length: 50 }).map((_, i) => (<div key={i} className="snowflake"></div>))}</div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative selection:bg-emerald-500/20">
      <ScreenEffect />
      <ToastContainer toasts={toasts} />
      {isTutorialActive && <Tutorial step={tutorialStep} setStep={setTutorialStep} completeTutorial={() => updateGameState({ tutorialCompleted: true })} />}
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
            <Terminal className="w-8 h-8 text-emerald-400" />
            암호화폐 채굴 타이쿤
          </h1>
          <p className="text-slate-500 text-sm mt-1">플레이어: {user.displayName}</p>
        </div>
        
        <div className="flex items-center flex-wrap justify-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          {ownedItems.clock && (
            <>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg"><Clock className="w-6 h-6 text-slate-400"/></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">시간</p>
                <p className="text-xl font-bold font-mono">{String(gameTime.hour).padStart(2, '0')}:{String(gameTime.minute).padStart(2, '0')}</p>
                <p className="text-xs text-slate-500">{gameTime.day}일차, {season}</p>
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
        </div>
      </header>
      
      {/* Main Content */}
      <main className="pb-24">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Server className="text-indigo-400" />채굴 현황</h2>
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
                                return (
                                <div key={comp.instanceId} className={`relative bg-slate-800/50 p-3 rounded-lg border flex flex-col items-center gap-2 group transition-all ${isStopped ? 'border-red-500/50' : 'border-indigo-500/20 hover:border-indigo-500/50'}`}>
                                    {(internetOnline && !isStopped) && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-ping-slow"></div>}
                                    {(!internetOnline || isStopped) && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
                                    <Cpu className={`w-8 h-8 ${isStopped ? 'text-slate-600' : 'text-slate-400 group-hover:text-indigo-400'} transition-colors`} />
                                    <div className="text-center">
                                        <p className="font-bold text-sm text-slate-200">{comp.name}</p>
                                        <p className={`text-xs ${isStopped ? 'text-red-400' : 'text-indigo-400'}`}>{isStopped ? '과열' : `티어 ${comp.tier}`}</p>
                                    </div>
                                    {(internetOnline && !isStopped) && <div className="w-full bg-slate-700 h-1 mt-1 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full animate-mining-bar"></div></div>}
                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => sellComputer(comp.instanceId)} className="text-[10px] bg-red-900/50 hover:bg-red-900/80 text-red-300 px-2 py-0.5 rounded">판매</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="bg-black rounded-xl border border-slate-800 p-4 shadow-inner font-mono text-sm h-48 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-900 pb-2"><Terminal className="w-4 h-4" /><span>시스템 로그</span></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                        {logs.map((log, i) => (<div key={i} className={`py-1 border-b border-slate-900/50 ${log.includes('🎉') || log.includes('🌙') ? 'text-yellow-300' : 'text-slate-300'}`}>{log}</div>))}
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      <Modal title="암호화폐 지갑" isOpen={activeModal === 'wallet'} onClose={() => setActiveModal(null)} Icon={DollarSign}>
        <div className="space-y-3">
          {(Object.keys(COIN_TYPES) as Array<keyof typeof COIN_TYPES>).map((key) => {
            const coin = COIN_TYPES[key];
            const count = inventory[key];
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${coin.border} ${coin.bg}`}>
                <div className="flex flex-col"><span className={`font-bold ${coin.color}`}>{coin.name}</span><span className="text-[10px] text-slate-400 opacity-70">가치: {coin.value.toLocaleString()} KRW</span></div>
                <div className="flex items-center gap-4"><span className="text-xl font-mono font-bold">{count}</span><button onClick={() => sellCoin(key)} disabled={count === 0} className={`px-3 py-1 rounded text-xs font-bold transition-all ${count > 0 ? 'bg-white text-black hover:scale-105' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>판매</button></div>
              </div>
            );
          })}
        </div>
        <button onClick={sellAll} className="w-full mt-4 text-sm bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-2 rounded border border-emerald-800 transition-colors">모두 판매</button>
      </Modal>

      <Modal title="일반 상점" isOpen={activeModal === 'general_store'} onClose={() => setActiveModal(null)} Icon={Home}>
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
      </Modal>

      <Modal title="하드웨어 상점" isOpen={activeModal === 'hardware_store'} onClose={() => setActiveModal(null)} Icon={ShoppingCart}>
        <div className="space-y-3">
            {COMPUTERS.map((comp) => {
                const canAfford = money >= comp.cost;
                return (
                  <button key={comp.id} onClick={() => buyComputer(comp)} disabled={!canAfford} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${canAfford ? 'bg-slate-800 border-slate-700 hover:border-orange-500 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${canAfford ? 'bg-slate-700 group-hover:bg-orange-900/30' : 'bg-slate-800'}`}><comp.icon className={`w-5 h-5 ${canAfford ? 'text-slate-300 group-hover:text-orange-400' : 'text-slate-600'}`} /></div>
                        <div><p className="font-bold text-slate-200">{comp.name}</p><p className="text-xs text-orange-400 font-mono">티어 {comp.tier}</p></div>
                    </div>
                    <div className="text-right"><p className={`font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>{comp.cost.toLocaleString()}</p><p className="text-[10px] text-slate-500">KRW</p></div>
                  </button>
                );
            })}
        </div>
      </Modal>

      {/* Bottom Nav */}
      <BottomNav onOpenModal={setActiveModal} onSignOut={handleSignOut} money={money} />

      <style>{`
        :root { --toast-translate-y: 100%; --toast-opacity: 0; }
        .toast-enter { --toast-translate-y: 0; --toast-opacity: 1; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        @keyframes mining-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-mining-bar { animation: mining-bar 5s infinite linear; }
        .animate-ping-slow { animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .snowflake { position: absolute; width: 10px; height: 10px; background: white; border-radius: 50%; opacity: 0.6; animation: fall linear infinite; }
        @keyframes fall { 0% { transform: translateY(-10vh) translateX(0); } 100% { transform: translateY(110vh) translateX(5vw); } }
        ${Array.from({ length: 50 }).map((_, i) => `.snowflake:nth-child(${i}) { left: ${Math.random() * 100}vw; animation-duration: ${Math.random() * 5 + 5}s; animation-delay: ${Math.random() * 5}s; transform: scale(${Math.random() * 0.5 + 0.5}); }`).join('\n')}
      `}</style>
    </div>
  );
};

// --- 자식 컴포넌트 ---
const LoginScreen = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
        <Terminal className="w-10 h-10 text-emerald-400" />
        암호화폐 채굴 타이쿤
      </h1>
      <p className="text-slate-400 mt-2">클라우드 저장 기능으로 어디서든 당신의 제국을 건설하세요.</p>
    </div>
    <button onClick={onSignIn} className="flex items-center gap-3 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors">
      <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
      Google 계정으로 로그인
    </button>
  </div>
);

const BottomNav = ({ onOpenModal, onSignOut, money }: { onOpenModal: (modal: string) => void, onSignOut: () => void, money: number }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 flex justify-around items-center p-2 z-40">
    <button onClick={() => onOpenModal('wallet')} className="flex flex-col items-center text-emerald-400 p-2 rounded-lg hover:bg-slate-800 w-24">
      <Wallet />
      <span className="text-xs mt-1 font-mono">{money.toLocaleString()}</span>
    </button>
    <button onClick={() => onOpenModal('hardware_store')} className="flex flex-col items-center text-orange-400 p-2 rounded-lg hover:bg-slate-800 w-24">
      <ShoppingCart />
      <span className="text-xs mt-1">하드웨어</span>
    </button>
    <button onClick={() => onOpenModal('general_store')} className="flex flex-col items-center text-lime-400 p-2 rounded-lg hover:bg-slate-800 w-24">
      <Home />
      <span className="text-xs mt-1">일반상점</span>
    </button>
    <button onClick={onSignOut} className="flex flex-col items-center text-red-400 p-2 rounded-lg hover:bg-slate-800 w-24">
      <LogOut />
      <span className="text-xs mt-1">로그아웃</span>
    </button>
  </nav>
);

const Modal = ({ title, isOpen, onClose, children, Icon }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode, Icon: React.ElementType }) => {
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

const ToastContainer = ({ toasts }: { toasts: ToastType[] }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 w-72">
    {toasts.map(toast => {
        const colors = {
            info: 'bg-blue-900/50 border-blue-700 text-blue-300',
            success: 'bg-green-900/50 border-green-700 text-green-300',
            warning: 'bg-yellow-900/50 border-yellow-700 text-yellow-300',
            error: 'bg-red-900/50 border-red-700 text-red-300',
        };
        const Icon = toast.icon;
        return (
            <div key={toast.id} className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-toast-in ${colors[toast.type]}`}>
                <Icon className="w-5 h-5" />
                <p className="text-sm font-medium">{toast.message}</p>
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

const Tutorial = ({ step, setStep, completeTutorial }: { step: number, setStep: (step: number) => void, completeTutorial: () => void }) => {
  const tutorialSteps = [
    { text: "채굴 타이쿤에 오신 것을 환영합니다! 이 튜토리얼이 게임의 기본을 안내해 드립니다.", highlight: null },
    { text: "먼저, 채굴을 시작하기 위해 컴퓨터가 필요합니다. 하단의 '하드웨어' 상점을 열어 첫 PC를 구매해 보세요.", highlight: "nav_hardware" },
    { text: "잘하셨어요! 이제 채굴이 자동으로 시작됩니다. 채굴된 코인은 '지갑'에서 확인할 수 있습니다. 지갑을 열어보세요.", highlight: "nav_wallet" },
    { text: "코인이 모이면 판매하여 돈을 벌 수 있습니다. '판매' 버튼을 눌러보세요. (지금은 코인이 없을 수 있습니다.)", highlight: "wallet_sell" },
    { text: "이제 모든 준비가 끝났습니다! 최고의 장비로 업그레이드하고, 날씨 변화에 대응하며 최고의 채굴왕이 되어보세요!", highlight: null },
  ];
  
  const currentStep = tutorialSteps[step - 1];
  if (!currentStep) return null;

  const nextStep = () => {
    if (step === tutorialSteps.length) {
      setStep(0);
      completeTutorial();
    } else if (step === 1) { // 1단계는 버튼으로
       setStep(step + 1);
    } // 다른 단계는 액션으로 진행
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-6 rounded-lg border border-emerald-500 shadow-lg max-w-sm text-center relative">
           <div className="absolute -top-4 -left-4 bg-emerald-500 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold">{step}</div>
            <p className="text-lg">{currentStep.text}</p>
            {(step === 1 || step === 5) && (
              <button onClick={nextStep} className="mt-4 bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg">
                {step === 5 ? "게임 시작!" : "다음"}
              </button>
            )}
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
