const API_BASE = "https://api.jolpi.ca/ergast/f1/current";

const TEAM_COLORS = {
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  williams: "#00A0ED",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  rb: "#6692FF",
  sauber: "#52E252",
  haas: "#B6BABD"
};

export const getTeamColor = (constructorId) => TEAM_COLORS[constructorId] || "#376b6d";

// 车队简称（用于 Logo 徽章）
const TEAM_ABBR = {
  ferrari: 'FER',
  red_bull: 'RBR',
  mclaren: 'MCL',
  mercedes: 'MER',
  williams: 'WIL',
  aston_martin: 'AMR',
  alpine: 'ALP',
  rb: 'RB',
  sauber: 'AUDI',
  haas: 'HAAS',
  cadillac: 'CAD',
};

export const getTeamAbbr = (constructorId) => TEAM_ABBR[constructorId] || constructorId?.slice(0, 3).toUpperCase() || '???';

// 大奖赛中文名映射
const RACE_NAMES_CN = {
  'Australian Grand Prix': '澳大利亚大奖赛',
  'Chinese Grand Prix': '中国大奖赛',
  'Japanese Grand Prix': '日本大奖赛',
  'Bahrain Grand Prix': '巴林大奖赛',
  'Saudi Arabian Grand Prix': '沙特阿拉伯大奖赛',
  'Miami Grand Prix': '迈阿密大奖赛',
  'Emilia Romagna Grand Prix': '艾米利亚-罗马涅大奖赛',
  'Monaco Grand Prix': '摩纳哥大奖赛',
  'Spanish Grand Prix': '西班牙大奖赛',
  'Barcelona Grand Prix': '巴塞罗那大奖赛',
  'Canadian Grand Prix': '加拿大大奖赛',
  'Austrian Grand Prix': '奥地利大奖赛',
  'British Grand Prix': '英国大奖赛',
  'Belgian Grand Prix': '比利时大奖赛',
  'Hungarian Grand Prix': '匈牙利大奖赛',
  'Dutch Grand Prix': '荷兰大奖赛',
  'Italian Grand Prix': '意大利大奖赛',
  'Azerbaijan Grand Prix': '阿塞拜疆大奖赛',
  'Singapore Grand Prix': '新加坡大奖赛',
  'United States Grand Prix': '美国大奖赛',
  'Mexico City Grand Prix': '墨西哥城大奖赛',
  'São Paulo Grand Prix': '圣保罗大奖赛',
  'Las Vegas Grand Prix': '拉斯维加斯大奖赛',
  'Qatar Grand Prix': '卡塔尔大奖赛',
  'Abu Dhabi Grand Prix': '阿布扎比大奖赛',
};

export const getRaceNameCN = (englishName) => RACE_NAMES_CN[englishName] || null;

// 国家中文名映射
const COUNTRY_NAMES_CN = {
  'Australia': '澳大利亚', 'China': '中国', 'Japan': '日本', 'Bahrain': '巴林',
  'Saudi Arabia': '沙特阿拉伯', 'USA': '美国', 'Italy': '意大利', 'Monaco': '摩纳哥',
  'Spain': '西班牙', 'Canada': '加拿大', 'Austria': '奥地利', 'UK': '英国',
  'Belgium': '比利时', 'Hungary': '匈牙利', 'Netherlands': '荷兰',
  'Azerbaijan': '阿塞拜疆', 'Singapore': '新加坡', 'Mexico': '墨西哥',
  'Brazil': '巴西', 'Qatar': '卡塔尔', 'UAE': '阿联酋',
  'United States': '美国', 'United Kingdom': '英国',
};

// 赛道中文名映射
const CIRCUIT_NAMES_CN = {
  'Albert Park Grand Prix Circuit': '阿尔伯特公园赛道',
  'Shanghai International Circuit': '上海国际赛车场',
  'Suzuka Circuit': '铃鹿赛道',
  'Bahrain International Circuit': '巴林国际赛道',
  'Jeddah Corniche Circuit': '吉达滨海赛道',
  'Miami International Autodrome': '迈阿密国际赛车场',
  'Autodromo Enzo e Dino Ferrari': '伊莫拉赛道',
  'Circuit de Monaco': '摩纳哥赛道',
  'Circuit de Barcelona-Catalunya': '巴塞罗那-加泰罗尼亚赛道',
  'Circuit Gilles Villeneuve': '吉尔·维伦纽夫赛道',
  'Red Bull Ring': '红牛赛道',
  'Silverstone Circuit': '银石赛道',
  'Circuit de Spa-Francorchamps': '斯帕-弗朗科尔尚赛道',
  'Hungaroring': '匈格罗宁赛道',
  'Circuit Park Zandvoort': '赞德沃特赛道',
  'Autodromo Nazionale di Monza': '蒙扎赛道',
  'Baku City Circuit': '巴库城市赛道',
  'Marina Bay Street Circuit': '滨海湾街道赛道',
  'Circuit of the Americas': '美洲赛道',
  'Autódromo Hermanos Rodríguez': '罗德里格斯兄弟赛道',
  'Autódromo José Carlos Pace': '英特拉格斯赛道',
  'Las Vegas Strip Circuit': '拉斯维加斯大道赛道',
  'Lusail International Circuit': '卢赛尔国际赛道',
  'Yas Marina Circuit': '亚斯码头赛道',
};

export const getCountryNameCN = (name) => COUNTRY_NAMES_CN[name] || name;
export const getCircuitNameCN = (name) => CIRCUIT_NAMES_CN[name] || name;

// 车手 driverId → 图片文件名映射（public/drivers/ 下）
const DRIVER_IMAGES = {
  max_verstappen: "3VER.png",
  norris: "4NOR.png",
  leclerc: "16LEC.png",
  hamilton: "44HAM.png",
  sainz: "55SAI.png",
  russell: "63RUSSL.png",
  piastri: "81PIA.png",
  alonso: "14ALO.png",
  stroll: "18STR.png",
  gasly: "10GAS.png",
  ocon: "31OCO.png",
  albon: "23ALB.png",
  hulkenberg: "27HUL.png",
  bottas: "77BOT.png",
  perez: "11PER.png",
  lawson: "30LAW.png",
  bearman: "87BEA.png",
  colapinto: "43COL.png",
  hadjar: "6HAD.png",
  antonelli: "12KIMI.png",
  bortoleto: "5BOR.png",
  arvid_lindblad: "41LIN.png",
};

export const getDriverImage = (driverId) => {
  const filename = DRIVER_IMAGES[driverId];
  return filename ? `/drivers/${filename}` : null;
};

export async function fetchAllData() {
  try {
    const [driversRes, teamsRes, calendarRes, allResultsRes, sprintRes] = await Promise.all([
      fetch(`${API_BASE}/driverStandings.json`),
      fetch(`${API_BASE}/constructorStandings.json`),
      fetch(`${API_BASE}.json`),
      fetch(`${API_BASE}/results.json?limit=100`),
      fetch(`${API_BASE}/sprint.json?limit=100`)
    ]);

    const driversData = await driversRes.json();
    const teamsData = await teamsRes.json();
    const calendarData = await calendarRes.json();
    const allResultsData = await allResultsRes.json();
    const sprintData = await sprintRes.json();

    // 1. Driver Standings
    const rawDrivers = driversData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    const driverStandings = rawDrivers.map(d => ({
      rank: parseInt(d.position),
      id: d.Driver.driverId,
      firstName: d.Driver.givenName,
      lastName: d.Driver.familyName,
      code: d.Driver.code,
      number: d.Driver.permanentNumber,
      team: d.Constructors[0]?.name || "Unknown",
      points: parseFloat(d.points),
      teamColor: getTeamColor(d.Constructors[0]?.constructorId)
    }));

    // 2. Team Standings
    const rawTeams = teamsData.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    const teamStandings = rawTeams.map(t => ({
      rank: parseInt(t.position),
      id: t.Constructor.constructorId,
      name: t.Constructor.name,
      points: parseFloat(t.points),
      teamColor: getTeamColor(t.Constructor.constructorId)
    }));

    // 3. Schedule & Next Race（包含所有 Session 时间）
    const rawRaces = calendarData.MRData.RaceTable.Races || [];
    const now = new Date();
    const parseSessionTime = (session) => {
      if (!session?.date) return null;
      return new Date(`${session.date}T${session.time || '15:00:00Z'}`).toISOString();
    };
    const schedule = rawRaces.map(r => {
      const raceDate = new Date(`${r.date}T${r.time || '15:00:00Z'}`);
      const isSprint = !!r.Sprint; // 冲刺周末标识
      return {
        id: r.round,
        round: r.round,
        name: r.raceName,
        circuit: r.Circuit.circuitName,
        country: r.Circuit.Location.country,
        date: raceDate.toISOString(),
        isSprint,
        sessions: {
          fp1: parseSessionTime(r.FirstPractice),
          fp2: parseSessionTime(r.SecondPractice),
          fp3: parseSessionTime(r.ThirdPractice),
          sprintQualifying: parseSessionTime(r.SprintQualifying),
          sprint: parseSessionTime(r.Sprint),
          qualifying: parseSessionTime(r.Qualifying),
          race: raceDate.toISOString(),
        },
        status: raceDate < now ? "completed" : "upcoming"
      };
    });

    const nextRace = schedule.find(r => r.status === "upcoming") || schedule[schedule.length - 1];

    // 4. Recent Results (All completed races this season, reversed so freshest is top)
    const completedRaces = allResultsData.MRData.RaceTable.Races || [];
    const recentResults = completedRaces.map(raceItem => ({
      id: raceItem.round,
      round: raceItem.round,
      name: raceItem.raceName,
      country: raceItem.Circuit.Location.country,
      date: `${raceItem.date}T${raceItem.time || '15:00:00Z'}`,
      podium: raceItem.Results ? raceItem.Results.slice(0, 3).map(res => ({
        position: parseInt(res.position),
        driverId: res.Driver.driverId,
        name: `${res.Driver.givenName[0]}. ${res.Driver.familyName}`,
        team: res.Constructor.name,
        time: res.position === '1' ? res.Time?.time || "Finished" : res.Time?.time || "Finished"
      })) : []
    })).reverse();

    return {
      driverStandings,
      teamStandings,
      schedule,
      nextRace,
      recentResults,
      allRaces: allResultsData.MRData.RaceTable.Races || [],
      allSprintRaces: sprintData.MRData?.RaceTable?.Races || []
    };
  } catch (error) {
    console.error("F1 API Fetch Failed:", error);
    return null;
  }
}

// 按需获取某轮分站的排位赛和冲刺赛数据
export async function fetchRaceWeekend(round) {
  try {
    const [qualRes, sprintRes] = await Promise.allSettled([
      fetch(`${API_BASE}/${round}/qualifying.json`),
      fetch(`${API_BASE}/${round}/sprint.json`),
    ]);

    let qualifying = null;
    let sprint = null;
    let sprintQualifying = null;

    // 排位赛结果
    if (qualRes.status === 'fulfilled' && qualRes.value.ok) {
      const data = await qualRes.value.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (race?.QualifyingResults?.length > 0) {
        qualifying = race.QualifyingResults.map(r => ({
          position: parseInt(r.position),
          driverId: r.Driver.driverId,
          code: r.Driver.code,
          firstName: r.Driver.givenName,
          lastName: r.Driver.familyName,
          constructorId: r.Constructor.constructorId,
          constructorName: r.Constructor.name,
          q1: r.Q1 || null,
          q2: r.Q2 || null,
          q3: r.Q3 || null,
        }));
      }
    }

    // 冲刺赛结果
    if (sprintRes.status === 'fulfilled' && sprintRes.value.ok) {
      const data = await sprintRes.value.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (race?.SprintResults?.length > 0) {
        sprint = race.SprintResults.map(r => ({
          position: parseInt(r.position),
          positionText: r.positionText,
          driverId: r.Driver.driverId,
          code: r.Driver.code,
          firstName: r.Driver.givenName,
          lastName: r.Driver.familyName,
          constructorId: r.Constructor.constructorId,
          constructorName: r.Constructor.name,
          grid: parseInt(r.grid),
          laps: parseInt(r.laps),
          status: r.status,
          time: r.Time?.time || null,
          points: parseFloat(r.points) || 0,
        }));

        // 从冲刺赛 grid 推算冲刺排位赛结果
        sprintQualifying = [...sprint]
          .sort((a, b) => a.grid - b.grid)
          .map((r, idx) => ({
            position: idx + 1,
            driverId: r.driverId,
            code: r.code,
            firstName: r.firstName,
            lastName: r.lastName,
            constructorId: r.constructorId,
            constructorName: r.constructorName,
          }));
      }
    }

    return { qualifying, sprint, sprintQualifying };
  } catch (error) {
    console.error('Failed to fetch race weekend data:', error);
    return { qualifying: null, sprint: null, sprintQualifying: null };
  }
}

// ========== OpenF1 API 练习赛数据 ==========
// 数据源: https://api.openf1.org/v1/ （原生支持 CORS，无需代理）
const OPENF1_BASE = 'https://api.openf1.org/v1';

// ---- OpenF1 Sessions 缓存 ----
let _practiceSessionsCache = null;

async function getOpenF1PracticeSessions() {
  if (_practiceSessionsCache) return _practiceSessionsCache;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${OPENF1_BASE}/sessions?year=2026&session_type=Practice`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    // 只保留正式练习赛（Practice 1/2/3），排除测试赛（Day 1/2/3）
    _practiceSessionsCache = data.filter(s => s.session_name.startsWith('Practice'));
    return _practiceSessionsCache;
  } catch (e) {
    console.warn('OpenF1 sessions 获取失败:', e);
    return [];
  }
}

// 格式化圈速秒数为 M:SS.xxx
function formatLapTime(seconds) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}

// ---- 单 Session 结果缓存 ----
const _sessionResultsCache = {};

// 获取单个练习赛 session 的排名结果
async function fetchSinglePracticeSession(sessionKey) {
  // 检查缓存
  if (_sessionResultsCache[sessionKey]) return _sessionResultsCache[sessionKey];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const [lapsRes, driversRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}`, { signal: controller.signal }),
      fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`, { signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);
    const laps = await lapsRes.json();
    const drivers = await driversRes.json();

    // 构建车手信息映射
    const driverMap = {};
    drivers.forEach(d => { driverMap[d.driver_number] = d; });

    // 找每位车手的最快有效圈速（排除进站出站圈）
    const bestLaps = {};
    laps.forEach(lap => {
      if (lap.is_pit_out_lap) return;
      if (!lap.lap_duration || lap.lap_duration <= 0) return;
      const num = lap.driver_number;
      if (!bestLaps[num] || lap.lap_duration < bestLaps[num].lap_duration) {
        bestLaps[num] = lap;
      }
    });

    // 转换为排名数组并排序
    const results = Object.entries(bestLaps)
      .map(([driverNum, lap]) => {
        const driver = driverMap[parseInt(driverNum)] || {};
        return {
          driverNumber: parseInt(driverNum),
          firstName: driver.first_name || '',
          lastName: driver.last_name || '',
          code: driver.name_acronym || '',
          teamName: driver.team_name || '',
          teamColor: driver.team_colour ? `#${driver.team_colour}` : '#999',
          bestLapTime: lap.lap_duration,
          bestLapFormatted: formatLapTime(lap.lap_duration),
          laps: laps.filter(l => l.driver_number === parseInt(driverNum) && !l.is_pit_out_lap && l.lap_duration > 0).length,
        };
      })
      .sort((a, b) => a.bestLapTime - b.bestLapTime)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    // 计算与第一名的差距
    if (results.length > 0) {
      const fastestTime = results[0].bestLapTime;
      results.forEach(r => {
        const gap = r.bestLapTime - fastestTime;
        r.gap = gap > 0 ? `+${gap.toFixed(3)}` : null;
      });
    }

    const finalResults = results.length > 0 ? results : null;
    // 写入缓存
    if (finalResults) _sessionResultsCache[sessionKey] = finalResults;
    return finalResults;
  } catch (e) {
    console.warn('练习赛圈速数据获取失败:', e);
    return null;
  }
}

/**
 * 获取指定分站的练习赛数据（使用 OpenF1 API，原生 CORS 支持）
 * @param {string|number} round - 分站轮次
 * @param {Array} schedule - 赛程数据
 * @returns {Promise<{fp1: Array|null, fp2: Array|null, fp3: Array|null, error: string|null}>}
 */
export async function fetchPracticeResults(round, schedule) {
  try {
    const raceInfo = schedule?.find(s => String(s.round) === String(round));
    if (!raceInfo?.sessions?.fp1) return { fp1: null, fp2: null, fp3: null, error: null };

    // 获取赛季所有练习赛 sessions
    const allSessions = await getOpenF1PracticeSessions();
    if (!allSessions.length) return { fp1: null, fp2: null, fp3: null, error: null };

    // 通过 FP1 的日期匹配对应站点的 OpenF1 sessions
    const fp1Date = raceInfo.sessions.fp1?.slice(0, 10); // 'YYYY-MM-DD'
    if (!fp1Date) return { fp1: null, fp2: null, fp3: null, error: null };

    const matchedFP1 = allSessions.find(s =>
      s.session_name === 'Practice 1' &&
      s.date_start.slice(0, 10) === fp1Date
    );
    if (!matchedFP1) return { fp1: null, fp2: null, fp3: null, error: null };

    const meetingKey = matchedFP1.meeting_key;
    const stationSessions = allSessions.filter(s => s.meeting_key === meetingKey);
    const fp1Session = stationSessions.find(s => s.session_name === 'Practice 1');
    const fp2Session = stationSessions.find(s => s.session_name === 'Practice 2');
    const fp3Session = stationSessions.find(s => s.session_name === 'Practice 3');

    // 只获取已经结束的 session
    const now = new Date();
    const shouldFetch = (session) => session && new Date(session.date_end) < now;

    const [fp1, fp2, fp3] = await Promise.all([
      shouldFetch(fp1Session) ? fetchSinglePracticeSession(fp1Session.session_key) : Promise.resolve(null),
      shouldFetch(fp2Session) ? fetchSinglePracticeSession(fp2Session.session_key) : Promise.resolve(null),
      shouldFetch(fp3Session) ? fetchSinglePracticeSession(fp3Session.session_key) : Promise.resolve(null),
    ]);

    return { fp1, fp2, fp3, error: null };
  } catch (error) {
    console.error('练习赛数据获取失败:', error);
    return { fp1: null, fp2: null, fp3: null, error: 'network' };
  }
}

