import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- INITIAL DATA FÖR 10 MATCHSITUATORER ---
const INITIAL_SUB_MATCHES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  type: i < 8 ? 'single' : 'double',
  homePlayer: '',
  awayPlayer: '',
  homeScore: 0,
  awayScore: 0,
  currentHomePoints: 501,
  currentAwayPoints: 501,
  status: 'not_started'
}));

// --- ADMIN VY ---
function AdminView({ matchData, setMatchData, isAdminAuthenticated, setIsAdminAuthenticated }) {
  const [passwordInput, setPasswordInput] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsAdminAuthenticated(true);
    } else {
      alert('Fel lösenord!');
    }
  };

  const handleTeamNameChange = (team, val) => {
    setMatchData(prev => ({ ...prev, [team]: val }));
  };

  const handlePlayerNameChange = (id, field, val) => {
    setMatchData(prev => ({
      ...prev,
      subMatches: prev.subMatches.map(sm => sm.id === id ? { ...sm, [field]: val } : sm)
    }));
  };

  if (!isAdminAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff', textAlign: 'center' }}>
        <h2 style={{ color: '#fcd34d', marginBottom: '16px' }}>🔑 Admin Inloggning</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Ange lösenord (1234)"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', marginBottom: '16px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Logga in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
        <h2 style={{ color: '#fcd34d', margin: '0 0 16px 0' }}>⚙️ Laginställningar</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Hemmalag</label>
            <input
              type="text"
              value={matchData.homeTeam}
              onChange={(e) => handleTeamNameChange('homeTeam', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Bortalag</label>
            <input
              type="text"
              value={matchData.awayTeam}
              onChange={(e) => handleTeamNameChange('awayTeam', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h2 style={{ color: '#fcd34d', margin: '0 0 16px 0' }}>🎯 Matchuppställning (1-10)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {matchData.subMatches.map((sm) => (
            <div key={sm.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '10px', alignItems: 'center', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#eab308' }}>Match {sm.id}</span>
              <input
                type="text"
                placeholder="Hemmaspelare"
                value={sm.homePlayer}
                onChange={(e) => handlePlayerNameChange(sm.id, 'homePlayer', e.target.value)}
                style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
              <input
                type="text"
                placeholder="Bortaspelare"
                value={sm.awayPlayer}
                onChange={(e) => handlePlayerNameChange(sm.id, 'awayPlayer', e.target.value)}
                style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SCORER VY ---
function N01Scorer({ match, homeTeam, awayTeam, onBack, onSave, onLiveUpdate }) {
  const [homeScore, setHomeScore] = useState(match.currentHomePoints || 501);
  const [awayScore, setAwayScore] = useState(match.currentAwayPoints || 501);
  const [homeLegs, setHomeLegs] = useState(match.homeScore || 0);
  const [awayLegs, setAwayLegs] = useState(match.awayScore || 0);
  const [turn, setTurn] = useState('home');
  const [inputVal, setInputVal] = useState('');
  const [rounds, setRounds] = useState([]);
  const [performances, setPerformances] = useState([]);

  const isMatchFinished = homeLegs === 3 || awayLegs === 3;
  const homeName = match.homePlayer || homeTeam || 'Hemmaspelare';
  const awayName = match.awayPlayer || awayTeam || 'Bortaspelare';

  useEffect(() => {
    if (onLiveUpdate) {
      onLiveUpdate(match.id, {
        homeScore: homeLegs,
        awayScore: awayLegs,
        currentHomePoints: homeScore,
        currentAwayPoints: awayScore,
        status: isMatchFinished ? 'completed' : 'live'
      }, performances);
    }
  }, [homeScore, awayScore, homeLegs, awayLegs, isMatchFinished]);

  const handleNumClick = (val) => {
    if (inputVal.length < 3) setInputVal(prev => prev + val);
  };

  const handleClear = () => setInputVal('');

  const handleEnterScore = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val) || val < 0 || val > 180) {
      setInputVal('');
      return;
    }

    if (val === 180) {
      const pName = turn === 'home' ? homeName : awayName;
      setPerformances(prev => [...prev, { player: pName, team: turn, text: '180!' }]);
    }

    if (turn === 'home') {
      const newScore = homeScore - val;
      if (newScore === 0) {
        setHomeLegs(prev => prev + 1);
        resetLeg();
      } else if (newScore < 0 || newScore === 1) {
        addRoundLog(turn, 'BUST');
        setTurn('away');
      } else {
        setHomeScore(newScore);
        addRoundLog(turn, val);
        setTurn('away');
      }
    } else {
      const newScore = awayScore - val;
      if (newScore === 0) {
        setAwayLegs(prev => prev + 1);
        resetLeg();
      } else if (newScore < 0 || newScore === 1) {
        addRoundLog(turn, 'BUST');
        setTurn('home');
      } else {
        setAwayScore(newScore);
        addRoundLog(turn, val);
        setTurn('home');
      }
    }
    setInputVal('');
  };

  const addRoundLog = (playerTurn, scoreVal) => {
    setRounds(prev => {
      const newRounds = [...prev];
      if (playerTurn === 'home') {
        newRounds.push({ round: newRounds.length + 1, home: scoreVal, away: null });
      } else {
        if (newRounds.length > 0 && newRounds[newRounds.length - 1].away === null) {
          newRounds[newRounds.length - 1].away = scoreVal;
        } else {
          newRounds.push({ round: newRounds.length + 1, home: null, away: scoreVal });
        }
      }
      return newRounds;
    });
  };

  const resetLeg = () => {
    setHomeScore(501);
    setAwayScore(501);
    setRounds([]);
    setTurn('home');
  };

  const handleUndo = () => {
    if (rounds.length === 0) return;
    setRounds(prev => prev.slice(0, -1));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={onBack} style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Tillbaka
        </button>
        <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px' }}>Match {match.id} ({match.type === 'single' ? 'Singel' : 'Dubbel'})</span>
        <button onClick={() => onSave({ homeScore: homeLegs, awayScore: awayLegs, currentHomePoints: homeScore, currentAwayPoints: awayScore, status: isMatchFinished ? 'completed' : 'live' }, performances)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
          Spara & Stäng
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{ backgroundColor: turn === 'home' ? '#1e293b' : '#0f172a', padding: '12px', borderRadius: '12px', border: turn === 'home' ? '2px solid #3b82f6' : '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>{homeName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'home' ? '#60a5fa' : '#cbd5e1' }}>{homeScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold' }}>Legs: {homeLegs}</div>
        </div>

        <div style={{ backgroundColor: turn === 'away' ? '#1e293b' : '#0f172a', padding: '12px', borderRadius: '12px', border: turn === 'away' ? '2px solid #f43f5e' : '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>{awayName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'away' ? '#f43f5e' : '#cbd5e1' }}>{awayScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold' }}>Legs: {awayLegs}</div>
        </div>
      </div>

      {!isMatchFinished && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', border: '1px solid #334155' }}>
              {inputVal || '0'}
            </div>
            <button onClick={handleUndo} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
              Ångra
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handleNumClick(num.toString())} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                {num}
              </button>
            ))}
            <button onClick={handleClear} style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              C
            </button>
            <button onClick={() => handleNumClick('0')} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
              0
            </button>
            <button onClick={handleEnterScore} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PUBLIK VY (MED DE STORA GULA LIVE-SIFFERBOXARNA) ---
function PublicView({ matchData, onSelectMatch }) {
  const homeTotalMatches = matchData.subMatches.filter(m => m.homeScore === 3).length;
  const awayTotalMatches = matchData.subMatches.filter(m => m.awayScore === 3).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{matchData.homeTeam || 'Hemmalag'}</div>
          <div style={{ backgroundColor: '#1e293b', padding: '10px 24px', borderRadius: '12px', border: '2px solid #334155' }}>
            <span style={{ fontSize: '36px', fontWeight: '900', color: '#fcd34d' }}>{homeTotalMatches}</span>
            <span style={{ fontSize: '24px', color: '#64748b', margin: '0 12px' }}>-</span>
            <span style={{ fontSize: '36px', fontWeight: '900', color: '#fcd34d' }}>{awayTotalMatches}</span>
          </div>
          <div style={{ flex: 1, fontSize: '24px', fontWeight: 'bold', color: '#f43f5e' }}>{matchData.awayTeam || 'Bortalag'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {matchData.subMatches.map((sm) => {
          const isLive = sm.status === 'live';
          const isCompleted = sm.status === 'completed';

          return (
            <div
              key={sm.id}
              onClick={() => onSelectMatch(sm)}
              style={{
                backgroundColor: isLive ? '#0f172a' : '#1e293b',
                borderRadius: '12px',
                padding: isLive ? '18px 20px' : '12px 16px',
                border: isLive ? '2px solid #22c55e' : '1px solid #334155',
                boxShadow: isLive ? '0 0 20px rgba(34, 197, 94, 0.25)' : 'none',
                cursor: 'pointer'
              }}
            >
              {isLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px' }}>
                    LIVE - MATCH {sm.id} ({sm.type === 'single' ? 'Singel' : 'Dubbel'})
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#eab308', width: '28px' }}>{sm.id}</span>
                  <span style={{ fontSize: isLive ? '20px' : '16px', fontWeight: 'bold', color: sm.homeScore === 3 ? '#22c55e' : '#fff' }}>
                    {sm.homePlayer || matchData.homeTeam || 'Hemmaspelare'}
                  </span>
                </div>

                {isLive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 15px' }}>
                    <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '20px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '8px', border: '1px solid #475569' }}>
                      {sm.homeScore}
                    </div>

                    {/* STOR GUL BOX */}
                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '30px', fontWeight: '900', padding: '6px 16px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '85px', textAlign: 'center' }}>
                      {sm.currentHomePoints}
                    </div>

                    <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '14px' }}>VS</span>

                    {/* STOR GUL BOX */}
                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '30px', fontWeight: '900', padding: '6px 16px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '85px', textAlign: 'center' }}>
                      {sm.currentAwayPoints}
                    </div>

                    <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '20px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '8px', border: '1px solid #475569' }}>
                      {sm.awayScore}
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#0f172a', padding: '6px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#fcd34d' : '#94a3b8' }}>{sm.homeScore}</span>
                    <span style={{ color: '#475569', fontSize: '12px' }}>-</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#fcd34d' : '#94a3b8' }}>{sm.awayScore}</span>
                  </div>
                )}

                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: isLive ? '20px' : '16px', fontWeight: 'bold', color: sm.awayScore === 3 ? '#22c55e' : '#fff' }}>
                    {sm.awayPlayer || matchData.awayTeam || 'Bortaspelare'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- HUVUDKOMPONENT ---
function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [matchData, setMatchData] = useState({
    homeTeam: 'Hemmalag',
    awayTeam: 'Bortalag',
    subMatches: INITIAL_SUB_MATCHES,
    performances: []
  });

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setActiveTab('scorer');
  };

  const handleLiveUpdateFromScorer = (subMatchId, updatedSubMatchData, scorerPerformances) => {
    setMatchData(prev => ({
      ...prev,
      subMatches: prev.subMatches.map(sm => sm.id === subMatchId ? { ...sm, ...updatedSubMatchData } : sm)
    }));
  };

  const handleSaveMatch = (updatedSubMatchData, newPerformances) => {
    if (!selectedMatch) return;
    setMatchData(prev => ({
      ...prev,
      subMatches: prev.subMatches.map(sm => sm.id === selectedMatch.id ? { ...sm, ...updatedSubMatchData } : sm),
      performances: [...prev.performances, ...newPerformances]
    }));
    setActiveTab('public');
    setSelectedMatch(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', padding: '15px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setActiveTab('public')} style={{ backgroundColor: activeTab === 'public' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
          📺 Publikvy
        </button>
        <button onClick={() => setActiveTab('admin')} style={{ backgroundColor: activeTab === 'admin' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
          ⚙️ Admin
        </button>
      </div>

      {activeTab === 'public' && <PublicView matchData={matchData} onSelectMatch={handleSelectMatch} />}
      {activeTab === 'admin' && <AdminView matchData={matchData} setMatchData={setMatchData} isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated} />}
      {activeTab === 'scorer' && selectedMatch && <N01Scorer match={selectedMatch} homeTeam={matchData.homeTeam} awayTeam={matchData.awayTeam} onBack={() => { setActiveTab('public'); setSelectedMatch(null); }} onSave={handleSaveMatch} onLiveUpdate={handleLiveUpdateFromScorer} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
