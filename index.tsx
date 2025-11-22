

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Cpu, Zap, ShoppingCart, Wallet, Server, Terminal, DollarSign, Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, Rainbow, Wifi, WifiOff, Moon, Star, Wind, Snowflake, AlertTriangle, Home, Clock, Bed, LogOut, X, LoaderCircle, CheckCircle, Info, Flame, BookOpen, Mail, Lock, HelpCircle, Settings, Eye } from "lucide-react";
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
  ALPHA: { name: 'ALPHA', value: 10000, ratePerTier: 0.030, color: 'text-green-400', border: 'border-green-500', bg: 'bg-green-900/30' },
  CUBE: { name: 'CUBE', value: 10000, ratePerTier: 0.025, color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/30' },
  LUNAR: { name: 'LUNAR', value: 20000, ratePerTier: 0.020, color: 'text-gray-200', border: 'border-gray-300', bg: 'bg-gray-800/50' },
  ENERGY: { name: 'ENERGY', value: 50000, ratePerTier: 0.015, color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-900/30' },
  PRISM: { name: 'PRISM', value: 100000, ratePerTier: 0.010, color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/30' },
};
const COMPUTERS = [
  { id: 'tier1', name: '스타터 PC', tier: 1, cost: 75000, icon: Cpu },
  { id: 'tier2', name: '게이머 PC', tier: 2, cost: 250000, icon: Server },
  { id: 'tier3', name: '프로 채굴기', tier: 3, cost: 700000, icon: Zap },
  { id: 'tier4', name: '퀀텀 슈퍼컴', tier: 4, cost: 1500000, icon: CloudLightning }
];
const GENERAL_STORE_ITEMS = [
    { id: 'clock', name: '디지털 시계', cost: 10000, description: '시간과 날짜를 표시합니다. 수면의 필수 조건입니다.', icon: Clock },
    { id: 'bed', name: '침대', cost: 50000, description: '21:00 이후 다음 날 8:00로 시간을 건너뜁니다.', icon: Bed },
    { id: 'almanac', name: '날씨 도감', cost: 75000, description: '경험한 날씨의 효과를 기록하고 확인합니다.', icon: BookOpen },
    { id: 'forecaster', name: '기상 예보관', cost: 120000, description: '다음 날씨를 미리 알려줍니다.', icon: Eye },
];
const MAX_COMPUTERS = 5;
type Season = '봄' | '여름' | '가을' | '겨울';
type WeatherType = '맑음' | '구름' | '비' | '천둥' | '산성비' | '무지개' | '황사' | '폭염' | '폭우' | '눈' | '별똥별' | '우박' | '오로라' | '블루문' | '유성우';
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
  '오로라': { name: '오로라', icon: Rainbow, color: 'text-teal-400', description: '겨울 밤에 희귀하게 나타나며, 모든 코인 채굴 확률이 대폭 상승합니다.' },
  '블루문': { name: '블루문', icon: Moon, color: 'text-blue-300', description: '맑은 날이 지속되면 나타나며, 채굴 딜레이가 감소합니다.' },
};
const SEASONS: Season[] = ['봄', '여름', '가을', '겨울'];
const SEASON_ICONS: { [key in Season]: string } = { '봄': '🌸', '여름': '☀️', '가을': '🍁', '겨울': '❄️' };

// --- 타입 정의 ---
interface GameState {
  money: number;
  inventory: { CUBE: number; LUNAR: number; ENERGY: number; PRISM: number; ALPHA: number; };
  myComputers: Array<{ instanceId: number; typeId: string; tier: number; name: string; }>;
  logs: string[];
  weather: WeatherType;
  nextWeather: WeatherType;
  internetOnline: boolean;
  gameTime: { day: number; hour: number; minute: number; };
  season: Season;
  ownedItems: { clock: boolean; bed: boolean; almanac: boolean; forecaster: boolean; };
  stoppedMiners: Array<[number, number]>;
  tutorialCompleted: boolean;
  experiencedWeather: WeatherType[];
  settings: { notifications: boolean; };
}
type ToastType = { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error'; icon: React.ElementType };

// --- 날씨 생성 유틸리티 ---
const generateNewWeather = (season: Season, currentIsNight: boolean, lastWeather: WeatherType, consecutiveClear: number): WeatherType => {
    let nextWeather: WeatherType;
    const rand = Math.random();

    if (currentIsNight && rand < 0.1) {
        if (Math.random() < 0.15) { // 15% chance to upgrade to meteor shower
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
  money: 100000, inventory: { CUBE: 0, LUNAR: 0, ENERGY: 0, PRISM: 0, ALPHA: 0 }, myComputers: [], logs: ["게임에 오신 것을 환영합니다!"], weather: '맑음', nextWeather: '맑음', internetOnline: true, gameTime: { day: 1, hour: 9, minute: 0 }, season: '봄', ownedItems: { clock: false, bed: false, almanac: false, forecaster: false }, stoppedMiners: [], tutorialCompleted: false, experiencedWeather: ['맑음'], settings: { notifications: true },
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

  const { money, inventory, myComputers, logs, weather, internetOnline, gameTime, season, ownedItems, stoppedMiners, tutorialCompleted, experiencedWeather, settings, nextWeather } = gameState;
  const isTutorialActive = !tutorialCompleted && tutorialStep > 0;

  const consecutiveClear = useRef(0);
  
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
          const loadedState = { ...initialGameState, ...loadedData };
          if (!loadedData.nextWeather) {
              const { season, gameTime, weather } = loadedState;
              const isNight = gameTime.hour >= 20 || gameTime.hour < 9;
              loadedState.nextWeather = generateNewWeather(season, isNight, weather, 0);
          }
          setGameState(loadedState);
          if (!loadedState.tutorialCompleted) {
              setTutorialStep(1);
          }
        } else {
          const newGameState = { ...initialGameState };
          newGameState.nextWeather = generateNewWeather(newGameState.season, false, newGameState.weather, 0);
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
  }, []);

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

  const mine = useCallback(() => {
    if (myComputers.length === 0) return;
    const stoppedMinersMap = new Map(stoppedMiners);

    const minedCoins: { [key in keyof typeof COIN_TYPES]?: number } = {};
    const rareFinds: { computerName: string, coinKey: keyof typeof COIN_TYPES }[] = [];

    myComputers.forEach(comp => {
        if (stoppedMinersMap.has(comp.instanceId)) return;

        (Object.keys(COIN_TYPES) as Array<keyof typeof COIN_TYPES>).forEach(coinKey => {
            const coin = COIN_TYPES[coinKey];
            let chance = comp.tier * coin.ratePerTier;

            switch(weather) {
                case '비': if(coinKey === 'CUBE') chance += comp.tier * 0.0025; break;
                case '천둥': if(coinKey === 'ENERGY') chance += comp.tier * 0.0015; break;
                case '산성비': chance *= 0.8; break;
                case '무지개': if(coinKey === 'PRISM') chance += comp.tier * 0.01; break;
                case '폭우': if(coinKey === 'CUBE') chance += comp.tier * 0.005; break;
                case '별똥별': chance *= 1.1; break;
                case '유성우': chance *= 1.5; break;
                case '우박': chance *= 0.8; break;
                case '오로라': chance *= 1.2; break;
            }
            
            if (Math.random() < chance / 2) {
                minedCoins[coinKey] = (minedCoins[coinKey] || 0) + 1;
                if (coinKey === 'PRISM' || coinKey === 'ENERGY') {
                    rareFinds.push({ computerName: comp.name, coinKey: coinKey });
                }
            }
        });
    });

    if (Object.keys(minedCoins).length > 0) {
        setGameState(prev => {
            const newInventory = { ...prev.inventory };
            for (const key in minedCoins) {
                const coinKey = key as keyof typeof COIN_TYPES;
                newInventory[coinKey] = (newInventory[coinKey] || 0) + (minedCoins[coinKey] || 0);
            }
            return { ...prev, inventory: newInventory };
        });

        rareFinds.forEach(find => {
            addLog(`🎉 ${find.computerName}에서 희귀한 ${find.coinKey} 발견!`);
            addToast(`${find.coinKey} 발견!`, 'success');
        });
    }
  }, [myComputers, weather, stoppedMiners, addLog, addToast]);
  
  // --- 채굴 & 날씨 & 효과 루프 (상태에 의존하도록 수정) ---
  useEffect(() => {
    const miningInterval = setInterval(() => {
      if (internetOnline && myComputers.length > 0) {
        mine();
      }
    }, 1000); // 1초마다 채굴
    return () => clearInterval(miningInterval);
  }, [mine, internetOnline, myComputers.length]);


  useEffect(() => {
    const weatherInterval = setInterval(() => {
      setGameState(prev => {
          const { gameTime, season, weather, nextWeather, experiencedWeather } = prev;
          const currentIsNight = gameTime.hour >= 20 || gameTime.hour < 9;
          
          const newWeather = nextWeather;
          
          if (newWeather === '맑음') {
              consecutiveClear.current++;
          } else {
              consecutiveClear.current = 0;
          }
          
          const newNextWeather = generateNewWeather(season, currentIsNight, newWeather, consecutiveClear.current);
          if (newNextWeather === '블루문') {
              consecutiveClear.current = 0;
          }

          const newState: GameState = { ...prev, weather: newWeather, nextWeather: newNextWeather };
          
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
    if (myComputers.length >= MAX_COMPUTERS) {
      addToast(`최대 ${MAX_COMPUTERS}개의 PC만 보유할 수 있습니다.`, 'warning');
      return;
    }
    if (money >= computerType.cost) {
      updateGameState({
        money: money - computerType.cost,
        myComputers: [...myComputers, { instanceId: Date.now() + Math.random(), typeId: computerType.id, tier: computerType.tier, name: computerType.name }]
      });
      addLog(`✅ ${computerType.name} 구매 완료`);
      if (isTutorialActive && tutorialStep === 3) {
        setActiveModal(null);
        setTutorialStep(4);
      }
    }
  };

  const sellComputer = (instanceId: number) => {
    const computer = myComputers.find(c => c.instanceId === instanceId);
    const originalInfo = COMPUTERS.find(c => c.id === computer?.typeId);
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
    const count = inventory[type];
    if (count > 0) {
      const value = count * COIN_TYPES[type].value;
      updateGameState({
          inventory: { ...inventory, [type]: 0 },
          money: money + value
      });
      addLog(`💰 ${count} ${type} 판매, ${value.toLocaleString()} KRW 획득`);
      if(isTutorialActive && tutorialStep === 5) setTutorialStep(6);
    }
  };

  const sellAll = () => {
    let totalValue = Object.values(COIN_TYPES).reduce((acc, coin) => {
        return acc + (inventory[coin.name as keyof typeof inventory] * coin.value);
    }, 0);
    if (totalValue > 0) {
      updateGameState({
        inventory: { CUBE: 0, LUNAR: 0, ENERGY: 0, PRISM: 0, ALPHA: 0 },
        money: money + totalValue
      });
      addLog(`💰 모든 코인 판매, ${totalValue.toLocaleString()} KRW 획득`);
    }
    if (isTutorialActive && tutorialStep === 5) setTutorialStep(6);
  };
  
  // --- 렌더링 로직 ---
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><LoaderCircle className="animate-spin w-10 h-10" /></div>;
  if (!user) return <LoginScreen />;

  const CurrentWeatherIcon = WEATHER_EFFECTS[weather].icon;
  // FIX: In JSX, component names must be capitalized. To render a component dynamically from an object property, it must first be assigned to a capitalized variable. This resolves the "JSX element type '...' does not have any construct or call signatures" error.
  const NextWeatherIcon = nextWeather ? WEATHER_EFFECTS[nextWeather].icon : null;
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {isTutorialActive && <Tutorial step={tutorialStep} setStep={setTutorialStep} completeTutorial={() => updateGameState({ tutorialCompleted: true })} />}
      
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
          {ownedItems.forecaster && nextWeather && (
            <>
            <div className="w-px h-10 bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-3" title={`다음 날씨 예보: ${WEATHER_EFFECTS[nextWeather].name}`}>
                <div className={`p-2 bg-opacity-30 rounded-lg`}>
                    {/* FIX: Used the capitalized variable `NextWeatherIcon` to correctly render the dynamic icon component. */}
                    {NextWeatherIcon && <NextWeatherIcon className={`w-6 h-6 ${WEATHER_EFFECTS[nextWeather].color}`} />}
                </div>
                <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">다음 예보</p>
                    <p className={`text-xl font-bold ${WEATHER_EFFECTS[nextWeather].color}`}>{WEATHER_EFFECTS[nextWeather].name}</p>
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
        <div className="space-y-3" id="wallet-sell-buttons">
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
        <button id="sell-all-btn" onClick={sellAll} className="w-full mt-4 text-sm bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-2 rounded border border-emerald-800 transition-colors">모두 판매</button>
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
                const atMaxComputers = myComputers.length >= MAX_COMPUTERS;
                return (
                  <button key={comp.id} id={comp.id === 'tier1' ? 'buy-tier1' : undefined} onClick={() => buyComputer(comp)} disabled={!canAfford || atMaxComputers} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${canAfford && !atMaxComputers ? 'bg-slate-800 border-slate-700 hover:border-orange-500 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${canAfford && !atMaxComputers ? 'bg-slate-700 group-hover:bg-orange-900/30' : 'bg-slate-800'}`}><comp.icon className={`w-5 h-5 ${canAfford && !atMaxComputers ? 'text-slate-300 group-hover:text-orange-400' : 'text-slate-600'}`} /></div>
                        <div><p className="font-bold text-slate-200">{comp.name}</p><p className="text-xs text-orange-400 font-mono">티어 {comp.tier}</p></div>
                    </div>
                    <div className="text-right"><p className={`font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>{comp.cost.toLocaleString()}</p><p className="text-[10px] text-slate-500">KRW</p></div>
                  </button>
                );
            })}
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
      <BottomNav onOpenModal={handleOpenModal} onSignOut={handleSignOut} money={money} ownedItems={ownedItems} />

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


const BottomNav = ({ onOpenModal, onSignOut, money, ownedItems }: { onOpenModal: (modal: string) => void, onSignOut: () => void, money: number, ownedItems: GameState['ownedItems'] }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 flex justify-around items-center p-2 z-40">
    <button id="nav-wallet" onClick={() => onOpenModal('wallet')} className="flex flex-col items-center text-emerald-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center">
      <Wallet />
      <span className="text-xs mt-1 font-mono truncate">{money.toLocaleString()}</span>
    </button>
    <button id="nav-hardware" onClick={() => onOpenModal('hardware_store')} className="flex flex-col items-center text-orange-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center">
      <ShoppingCart />
      <span className="text-xs mt-1">하드웨어</span>
    </button>
    <button onClick={() => onOpenModal('general_store')} className="flex flex-col items-center text-lime-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center">
      <Home />
      <span className="text-xs mt-1">일반상점</span>
    </button>
    <button id="nav-almanac" onClick={() => onOpenModal('almanac')} disabled={!ownedItems.almanac} title={!ownedItems.almanac ? "일반 상점에서 구매 필요" : "날씨 도감"} className="flex flex-col items-center text-sky-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center disabled:opacity-50 disabled:cursor-not-allowed">
      <BookOpen />
      <span className="text-xs mt-1">날씨도감</span>
    </button>
    <button onClick={() => onOpenModal('settings')} className="flex flex-col items-center text-slate-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center">
      <Settings />
      <span className="text-xs mt-1">설정</span>
    </button>
    <button onClick={onSignOut} className="flex flex-col items-center text-red-400 p-2 rounded-lg hover:bg-slate-800 w-20 text-center">
      <LogOut />
      <span className="text-xs mt-1">로그아웃</span>
    </button>
  </nav>
);

// FIX: Explicitly typed Modal as React.FC to resolve issues with TypeScript's inference of the `children` prop.
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
    <div className="fixed top-4 right-4 z-[200] space-y-2 w-72">
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
  
    return <div style={style} className={type === 'circle' ? 'tutorial-highlight-circle' : 'tutorial-highlight-border'}></div>;
};
  
const Tutorial = ({ step, setStep, completeTutorial }: { step: number, setStep: (step: number) => void, completeTutorial: () => void }) => {
    // FIX: Added 'as const' to ensure TypeScript infers the literal types for 'type' property.
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