const qs = sel => document.querySelector(sel);
const player = qs('#player');
const queryInput = qs('#query');
const urlInput = qs('#urlInput');

let history = JSON.parse(localStorage.getItem('ytHistory') || '[]');

// 履歴表示更新
function updateHistoryUI() {
  const list = qs('#historyList');
  list.innerHTML = '';
  history.forEach((item, idx) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = `${idx+1}. ${item.title} — ${item.author}`;
    a.target = "_blank";

    const delBtn = document.createElement('button');
    delBtn.textContent = "削除";
    delBtn.className = "btn";
    delBtn.addEventListener('click', () => {
      history.splice(idx,1);
      localStorage.setItem('ytHistory', JSON.stringify(history));
      updateHistoryUI();
    });

    li.appendChild(a);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// oEmbedで動画情報取得
async function fetchOEmbedInfo(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("oEmbed取得失敗");
    const data = await res.json();
    return {
      title: data.title,
      author: data.author_name,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch {
    return { title: videoId, author: "", url: `https://www.youtube.com/watch?v=${videoId}` };
  }
}

// 履歴追加
async function addToHistory(id) {
  const info = await fetchOEmbedInfo(id);
  history.unshift(info);
  if (history.length > 20) history = history.slice(0,20);
  localStorage.setItem('ytHistory', JSON.stringify(history));
  updateHistoryUI();
}

// 検索再生
function setPlayerToSearch(q) {
  const safe = encodeURIComponent(q.trim());
  if (!safe) return;
  player.src = `https://www.youtube.com/embed?listType=search&list=${safe}`;
}

// URL/IDから動画ID抽出
function extractVideoId(input) {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (u.searchParams.has('v')) {
      const id = u.searchParams.get('v');
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (u.pathname.includes('/embed/')) {
      const id = u.pathname.split('/').pop();
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    return null;
  } catch { return null; }
}

// 動画再生
async function setPlayerToVideo(id) {
  player.src = `https://www.youtube.com/embed/${id}`;
  await addToHistory(id);
}

// イベント設定
qs('#searchBtn').addEventListener('click', () => setPlayerToSearch(queryInput.value));
qs('#clearBtn').addEventListener('click', () => {
  queryInput.value = '';
  urlInput.value = '';
  player.src = 'https://www.youtube.com/embed?listType=search&list=%E3%83%88%E3%83%AC%E3%83%B3%E3%83%89';
});
qs('#loadUrlBtn').addEventListener('click', () => {
  const id = extractVideoId(urlInput.value);
  if (!id) { alert('有効なYouTubeのURLまたは動画IDを入力してください。'); return; }
  setPlayerToVideo(id);
});
queryInput.addEventListener('keydown', e => { if (e.key === 'Enter') setPlayerToSearch(queryInput.value); });
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') qs('#loadUrlBtn').click(); });
qs('#clearHistoryBtn').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('ytHistory');
  updateHistoryUI();
});

// 初期化
updateHistoryUI();
