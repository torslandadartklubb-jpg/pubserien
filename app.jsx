import React, { useState, useEffect, useRef } from 'react';

// --- INITIAL DATA FÖR 10 MATCHSITUATORER ---
const INITIAL_SUB_MATCHES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  type: i < 8 ? 'single' : 'double', // Match 1-8 Singel, 9-10 Dubbel
  homePlayer: '',
  awayPlayer: '',
  homeScore: 0,
  awayScore: 0,
  currentHomePoints: 501,
  currentAwayPoints: 501,
  status: 'not_started' // 'not_started', 'live', 'completed'
}));

// --- 1. ADMIN VY ---
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
        <h2 style={{ color: '#fcd34d', marginBottom: '16px' }}>🔑 Admin Loggin</h2>
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

// --- 2. SCORER VY (N01 Match-räknare) ---
function N01Scorer({ match, homeTeam, awayTeam, onBack, onSave, onLiveUpdate }) {
  const [homeScore, setHomeScore] = useState(match.currentHomePoints || 501);
  const [awayScore, setAwayScore] = useState(match.currentAwayPoints || 501);
  const [homeLegs, setHomeLegs] = useState(match.homeScore || 0);
  const [awayLegs, setAwayLegs] = useState(match.awayScore || 0);
  const [turn, setTurn] = useState('home');
  const [inputVal, setInputVal] = useState('');
  const [rounds, setRounds] = useState([]);
  const [performances, setPerformances] = useState([]);

  const [scoringActive, setScoringActive] = useState(false);
  const [scoringHomeInput, setScoringHomeInput] = useState('');
  const [scoringAwayInput, setScoringAwayInput] = useState('');
  const [scoringConfirm, setScoringConfirm] = useState(null);

  const logContainerRef = useRef(null);

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

  const handleOpenRemainingModal = () => {};
  const handleEditRound = () => {};
  const renderCellContent = (val) => val !== null && val !== undefined ? val : '-';

  const handleScoringSubmit = () => {
    const h = parseInt(scoringHomeInput, 10) || 0;
    const a = parseInt(scoringAwayInput, 10) || 0;
    const winnerName = h > a ? homeName : awayName;
    setScoringConfirm({ winnerName, homeVal: h, awayVal: a });
  };

  const confirmScoringWinner = () => {
    if (scoringConfirm.homeVal > scoringConfirm.awayVal) {
      setHomeLegs(prev => prev + 1);
    } else {
      setAwayLegs(prev => prev + 1);
    }
    setScoringConfirm(null);
    setScoringActive(false);
    resetLeg();
  };

  const cancelScoringConfirm = () => setScoringConfirm(null);

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
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'home' ? '#60a5fa' : '#cbd5e1', lineHeight: '1' }}>{homeScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold', marginTop: '6px' }}>Legs: {homeLegs}</div>
        </div>

        <div style={{ backgroundColor: turn === 'away' ? '#1e293b' : '#0f172a', padding: '12px', borderRadius: '12px', border: turn === 'away' ? '2px solid #f43f5e' : '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'away' ? '#f43f5e' : '#cbd5e1', lineHeight: '1' }}>{awayScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold', marginTop: '6px' }}>Legs: {awayLegs}</div>
        </div>
      </div>

      <div ref={logContainerRef} style={{ height: '140px', overflowY: 'auto', backgroundColor: '#090d16', borderRadius: '8px', padding: '8px', marginBottom: '12px', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b' }}>
              <th style={{ paddingBottom: '4px' }}>Hemmaspelare</th>
              <th style={{ paddingBottom: '4px', width: '50px' }}>Pil</th>
              <th style={{ paddingBottom: '4px' }}>Bortaspelare</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                <td onClick={() => handleEditRound(i, 'home')} style={{ padding: '4px', cursor: 'pointer' }}>{renderCellContent(r.home)}</td>
                <td style={{ color: '#475569', fontSize: '11px' }}>{r.round}</td>
                <td onClick={() => handleEditRound(i, 'away')} style={{ padding: '4px', cursor: 'pointer' }}>{renderCellContent(r.away)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isMatchFinished && !scoringActive && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', border: '1px solid #334155' }}>
              {inputVal || '0'}
            </div>
            <button onClick={handleOpenRemainingModal} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
              Sätt kvar
            </button>
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

      {scoringActive && (
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '2px solid #eab308' }}>
          <h3 style={{ color: '#eab308', margin: '0 0 10px 0', fontSize: '16px', textAlign: 'center' }}>SCORING</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>{homeName}</label>
              <input type="number" placeholder="Poäng" value={scoringHomeInput} onChange={(e) => setScoringHomeInput(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>{awayName}</label>
              <input type="number" placeholder="Poäng" value={scoringAwayInput} onChange={(e) => setScoringAwayInput(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={handleScoringSubmit} style={{ width: '100%', backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Registrera Scoring
          </button>
        </div>
      )}

      {scoringConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #eab308', borderRadius: '16px', padding: '24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 10px 0' }}>Bekräfta Scoring-vinnare</h3>
            <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '20px' }}>
              Vinnare av legget är <strong style={{ color: '#fcd34d' }}>{scoringConfirm.winnerName}</strong> ({scoringConfirm.homeVal} vs {scoringConfirm.awayVal}).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={confirmScoringWinner} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Godkänn
              </button>
              <button onClick={cancelScoringConfirm} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. PUBLIK VY (MED DE STORA LIVE-SIFFERBOXARNA) ---
function PublicView({ matchData, onSelectMatch }) {
  const homeTotalMatches = matchData.subMatches.filter(m => m.homeScore === 3).length;
  const awayTotalMatches = matchData.subMatches.filter(m => m.awayScore === 3).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      
      {/* Huvudresultat */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '20px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
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

      {/* Matchlista med stor expanderande live-design */}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
            >
              {isLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>
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

                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '30px', fontWeight: '900', padding: '6px 16px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '85px', textAlign: 'center', letterSpacing: '1px' }}>
                      {sm.currentHomePoints}
                    </div>

                    <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '14px' }}>VS</span>

                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '30px', fontWeight: '900', padding: '6px 16px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '85px', textAlign: 'center', letterSpacing: '1px' }}>
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

      <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ color: '#fcd34d', margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold' }}>⭐ MATCHENS PRESTATIONER (180s / Utgångar)</h3>
        {matchData.performances.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Inga registrerade höga utgångar eller 180s än.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {matchData.performances.map((p, idx) => (
              <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '13px' }}>
                <strong style={{ color: p.team === 'home' ? '#60a5fa' : '#f43f5e' }}>{p.player}</strong>: <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 4. HUVUDKOMPONENT (App) ---
export default function App() {
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
    setMatchData(prev => {
      const updatedMatches = prev.subMatches.map(sm => sm.id === subMatchId ? { ...sm, ...updatedSubMatchData } : sm);
      return {
        ...prev,
        subMatches: updatedMatches
      };
    });
  };

  const handleSaveMatch = (updatedSubMatchData, newPerformances) => {
    if (!selectedMatch) return;

    setMatchData(prev => {
      const updatedMatches = prev.subMatches.map(sm => sm.id === selectedMatch.id ? { ...sm, ...updatedSubMatchData } : sm);
      const combinedPerformances = [...prev.performances, ...newPerformances];

      return {
        ...prev,
        subMatches: updatedMatches,
        performances: combinedPerformances
      };
    });

    setActiveTab('public');
    setSelectedMatch(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', padding: '15px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('public')}
          style={{
            backgroundColor: activeTab === 'public' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          📺 Publikvy
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          style={{
            backgroundColor: activeTab === 'admin' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ⚙️ Admin
        </button>
      </div>

      {activeTab === 'public' && (
        <PublicView matchData={matchData} onSelectMatch={handleSelectMatch} />
      )}

      {activeTab === 'admin' && (
        <AdminView
          matchData={matchData}
          setMatchData={setMatchData}
          isAdminAuthenticated={isAdminAuthenticated}
          setIsAdminAuthenticated={setIsAdminAuthenticated}
        />
      )}

      {activeTab === 'scorer' && selectedMatch && (
        <N01Scorer
          match={selectedMatch}
          homeTeam={matchData.homeTeam}
          awayTeam={matchData.awayTeam}
          onBack={() => { setActiveTab('public'); setSelectedMatch(null); }}
          onSave={handleSaveMatch}
          onLiveUpdate={handleLiveUpdateFromScorer}
        />
      )}
    </div>
  );
}
