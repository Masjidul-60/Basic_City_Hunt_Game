/**
 * Campus Striker: Anime Sniper & Combat Arena
 * High-octane anime fighting and sniper combat game with raw HTML5 Canvas performance,
 * procedural Web Audio music & SFX, Google Drive asset linkage, and multiple game modes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { CHARACTERS } from './assets/sprites';
import { CharacterStats, GameMode, WeaponUpgrade, CustomAssetConfig } from './types/game';
import { soundEngine } from './audio/soundEngine';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { DriveAssetModal } from './components/DriveAssetModal';
import { ArmoryModal } from './components/ArmoryModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameOverModal } from './components/GameOverModal';
import { JavaSourceStudioModal } from './components/JavaSourceStudioModal';
import { Crosshair, Sword, Users, FolderOpen, ShoppingBag, Shield, Volume2, VolumeX, Maximize2, Code, Download } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & Game States
  const [selectedChar, setSelectedChar] = useState<CharacterStats>(CHARACTERS[0]);
  const [gameMode, setGameMode] = useState<GameMode>('brawler');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Modals
  const [isArmoryOpen, setIsArmoryOpen] = useState<boolean>(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState<boolean>(false);
  const [isCharSelectOpen, setIsCharSelectOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isJavaStudioOpen, setIsJavaStudioOpen] = useState<boolean>(false);

  // Persistent Player Stats & Economy
  const [coins, setCoins] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cs_coins'));
    return Number.isFinite(saved) && saved >= 0 ? saved : 150;
  });
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cs_highscore'));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });
  const highScoreRef = useRef(highScore);

  // Upgrades List
  const [upgrades, setUpgrades] = useState<WeaponUpgrade[]>([
    {
      id: 'sniper_power',
      name: 'Barrett .50 Caliber Chamber',
      type: 'sniper',
      level: 1,
      maxLevel: 5,
      cost: 100,
      description: 'Increases sniper rifle base bullet damage by +25.',
      bonus: '+25 Sniper Dmg',
    },
    {
      id: 'katana_edge',
      name: 'Muramasa High-Frequency Blade',
      type: 'melee',
      level: 1,
      maxLevel: 5,
      cost: 80,
      description: 'Sharpens kendo katana slashing power by +15.',
      bonus: '+15 Melee Dmg',
    },
    {
      id: 'kevlar_vest',
      name: 'Tactical Campus Kevlar',
      type: 'armor',
      level: 1,
      maxLevel: 5,
      cost: 120,
      description: 'Boosts maximum shield & health pool by +30 HP.',
      bonus: '+30 Max HP',
    },
    {
      id: 'thermal_scope',
      name: 'Night Vision Thermal Scope',
      type: 'scope',
      level: 1,
      maxLevel: 3,
      cost: 150,
      description: 'Increases critical headshot focus stabilization by +20%.',
      bonus: '+20% Focus Rate',
    },
  ]);

  // Google Drive & Custom Assets Config
  const [customAssets, setCustomAssets] = useState<CustomAssetConfig>({
    driveFolderUrl: 'https://drive.google.com/drive/folders/1cLy1lYogrjyDyIdeRQ1P6bCdfJjMbOL_',
  });

  // UI Mirror state synced with engine
  const [hudState, setHudState] = useState({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 44,
      height: 64,
      facing: 1 as 1 | -1,
      isGrounded: true,
      isAttacking: false,
      attackTimer: 0,
      attackCombo: 1,
      isScoping: false,
      scopeZoom: 4,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      hp: 300,
      maxHp: 300,
      lives: 3,
      maxLives: 3,
      focus: 100,
      maxFocus: 100,
      ultimateCharge: 30,
      ammo: 5,
      maxAmmo: 5,
      isReloading: false,
      reloadTimer: 0,
      invulnerableTimer: 0,
      isJumpKicking: false,
      isSpinSpecial: false,
      spinTimer: 0,
      isKnockedDown: false,
      knockdownTimer: 0,
      heldWeapon: 'katana' as 'fists' | 'katana' | 'baseball_bat' | 'shotgun' | 'sniper',
      weaponDurability: 100,
    },
    wave: 1,
    score: 0,
    combo: 0,
  });

  // Initialize Canvas & Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    let lastHudUpdate = 0;
    const canvas = canvasRef.current;
    // Set standard 16:9 canvas resolution
    canvas.width = 1280;
    canvas.height = 720;

    const engine = new GameEngine(canvas, selectedChar, gameMode);
    engine.coins = coins;
    engine.customAssets = customAssets;

    engine.onStateUpdate = () => {
      if (engine.isPaused) return;
      const now = performance.now();
      if (now - lastHudUpdate >= 100) {
        lastHudUpdate = now;
        setHudState({
          player: { ...engine.player },
          wave: engine.wave,
          score: engine.score,
          combo: engine.combo,
        });
        setCoins(engine.coins);
      }
      if (engine.score > highScoreRef.current) {
        highScoreRef.current = engine.score;
        setHighScore(engine.score);
        localStorage.setItem('cs_highscore', engine.score.toString());
      }
    };

    engine.onGameOver = (won, finalScore) => {
      setIsVictory(won);
      setIsGameOverOpen(true);
      if (finalScore > highScoreRef.current) {
        highScoreRef.current = finalScore;
        setHighScore(finalScore);
        localStorage.setItem('cs_highscore', finalScore.toString());
      }
    };

    engine.start();
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused =
        isPaused || isArmoryOpen || isAssetsOpen || isCharSelectOpen || isJavaStudioOpen;
    }
  }, [isPaused, isArmoryOpen, isAssetsOpen, isCharSelectOpen, isJavaStudioOpen]);

  useEffect(() => {
    localStorage.setItem('cs_coins', coins.toString());
  }, [coins]);

  // Update mode when changed
  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    setIsGameOverOpen(false);
    if (engineRef.current) {
      engineRef.current.initMode(newMode);
    }
  };

  // Update character
  const handleCharSelect = (char: CharacterStats) => {
    setSelectedChar(char);
    if (engineRef.current) {
      engineRef.current.setCharacter(char);
    }
  };

  // Sound toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Pause toggle
  const handleTogglePause = () => {
    const next = !engineRef.current?.isPaused;
    setIsPaused(next);
    if (engineRef.current) {
      engineRef.current.isPaused = next;
    }
  };

  // Purchase upgrade
  const handlePurchaseUpgrade = (id: string) => {
    const item = upgrades.find((u) => u.id === id);
    if (!item || coins < item.cost || item.level >= item.maxLevel) return;

    const newCoins = coins - item.cost;
    setCoins(newCoins);
    localStorage.setItem('cs_coins', newCoins.toString());

    setUpgrades((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            level: u.level + 1,
            cost: Math.round(u.cost * 1.6),
          };
        }
        return u;
      })
    );

    // Apply stats to player
    if (engineRef.current) {
      engineRef.current.coins = newCoins;
      if (id === 'sniper_power') {
        engineRef.current.sniperDamageBonus += 25;
      } else if (id === 'katana_edge') {
        engineRef.current.meleeDamageBonus += 15;
      } else if (id === 'kevlar_vest') {
        engineRef.current.armorBonus += 30;
        engineRef.current.player.maxHp += 30;
        engineRef.current.player.hp += 30;
      } else if (id === 'thermal_scope') {
        engineRef.current.focusRecoveryMultiplier += 0.2;
      }
    }
  };

  // Save custom assets
  const handleSaveAssets = (newConfig: CustomAssetConfig) => {
    setCustomAssets(newConfig);
    if (engineRef.current) {
      engineRef.current.customAssets = newConfig;
      engineRef.current.player.customSpriteUrl = newConfig.playerSpriteUrl;
    }
  };

  // Restart current mode
  const handleRestart = () => {
    setIsGameOverOpen(false);
    if (engineRef.current) {
      engineRef.current.initMode(gameMode);
    }
  };

  // Fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Game Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-md shadow-sky-500/20">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white">CAMPUS STRIKER</h1>
              <span className="text-[10px] bg-sky-500/15 text-sky-400 font-bold px-1.5 py-0.5 rounded border border-sky-500/30 uppercase">
                ANIME TACTICAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Combat Arena • Sniper Elimination • Drive Pictures Link
            </p>
          </div>
        </div>

        {/* Game Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleModeChange('brawler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              gameMode === 'brawler'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Campus Brawler</span>
          </button>

          <button
            onClick={() => handleModeChange('sniper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              gameMode === 'sniper'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clocktower Sniper</span>
          </button>

          <button
            onClick={() => handleModeChange('boss_duel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              gameMode === 'boss_duel'
                ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Boss Duel</span>
          </button>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2">
          {/* Java Swing / AWT Source Studio Button */}
          <button
            onClick={() => setIsJavaStudioOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs font-black shadow-md shadow-amber-500/10 transition cursor-pointer"
            title="Inspect & Download Raw Java Swing / AWT Code"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Java Swing & AWT Code</span>
            <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-mono font-bold">.java</span>
          </button>

          {/* Fighter Changer */}
          <button
            onClick={() => setIsCharSelectOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            <img
              src={selectedChar.avatar}
              alt={selectedChar.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="hidden md:inline">{selectedChar.name}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Stage Container */}
      <main className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center overflow-hidden">
        <div
          className="relative max-h-full max-w-full overflow-hidden shadow-2xl"
          style={{
            width: 'min(100%, calc((100dvh - 3.5rem) * 16 / 9))',
            aspectRatio: '16 / 9',
          }}
        >
          {/* Canvas Engine */}
          <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair" />

          {/* Real-time HUD */}
          <HUD
            player={hudState.player}
            character={selectedChar}
            mode={gameMode}
            wave={hudState.wave}
            score={hudState.score}
            coins={coins}
            combo={hudState.combo}
            isMuted={isMuted}
            isPaused={isPaused}
            onToggleMute={handleToggleMute}
            onTogglePause={handleTogglePause}
            onOpenArmory={() => setIsArmoryOpen(true)}
            onOpenAssets={() => setIsAssetsOpen(true)}
            onCastUltimate={() => engineRef.current?.castUltimate()}
            onToggleScope={() => engineRef.current?.toggleScope()}
            onReload={() => engineRef.current?.reloadRifle()}
          />

          {/* Mobile & Touch Gamepad Controls */}
          <TouchControls
            onMoveLeft={(pressed) => {
              if (engineRef.current) engineRef.current.keys['a'] = pressed;
            }}
            onMoveRight={(pressed) => {
              if (engineRef.current) engineRef.current.keys['d'] = pressed;
            }}
            onJump={() => {
              if (engineRef.current && engineRef.current.player.isGrounded) {
                engineRef.current.player.vy = -13.5;
                engineRef.current.player.isGrounded = false;
                soundEngine.playJump();
              }
            }}
            onAttack={() => engineRef.current?.performMeleeAttack()}
            onShoot={() => engineRef.current?.fireSniperRifle()}
            onDash={() => engineRef.current?.performDash()}
            onToggleScope={() => engineRef.current?.toggleScope()}
            onReload={() => engineRef.current?.reloadRifle()}
            onCastUltimate={() => engineRef.current?.castUltimate()}
            onSpinSpecial={() => engineRef.current?.performSpinSpecial()}
            canUltimate={hudState.player.ultimateCharge >= 100}
          />
        </div>
      </main>

      {/* Modals */}
      <JavaSourceStudioModal
        isOpen={isJavaStudioOpen}
        onClose={() => setIsJavaStudioOpen(false)}
      />

      <DriveAssetModal
        isOpen={isAssetsOpen}
        onClose={() => setIsAssetsOpen(false)}
        config={customAssets}
        onSaveConfig={handleSaveAssets}
      />

      <ArmoryModal
        isOpen={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
        coins={coins}
        upgrades={upgrades}
        onPurchaseUpgrade={handlePurchaseUpgrade}
      />

      <CharacterSelectModal
        isOpen={isCharSelectOpen}
        onClose={() => setIsCharSelectOpen(false)}
        selectedChar={selectedChar}
        onSelectChar={handleCharSelect}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        isVictory={isVictory}
        score={hudState.score}
        wave={hudState.wave}
        mode={gameMode}
        onRestart={handleRestart}
        onChangeMode={handleModeChange}
      />
    </div>
  );
}
