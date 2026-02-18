'use strict';

const { createRng } = require('./hash');

const HANDLE = '@woogie.dev';
const BRAND_TAG = '#woogiedev';

// ---------------------------------------------------------------------------
// Hook templates — category path → array of hooks
// One is selected deterministically per post via ref hash.
// Lookup order: most specific path first, then progressively broader.
// ---------------------------------------------------------------------------

const HOOKS = {
  ko: {
    'Development/Apple/iOS': [
      '제가 써보니 정말 좋았던 iOS 팁이에요 📱',
      'iOS 개발하면서 알게 된 걸 공유해봅니다 🔥',
      '혹시 이 방법 써보셨나요? 📱',
      'iOS 개발할 때 도움이 됐던 내용이에요 🚀',
    ],
    'Development/Apple/macOS': [
      'macOS에서 이런 것도 만들 수 있더라고요 🖥️',
      '맥 앱 개발하면서 배운 걸 정리해봤어요 ✨',
      '혹시 이런 macOS 기능 아셨나요? 🤔',
    ],
    'Development/Apple/Xcode': [
      'Xcode 쓰면서 발견한 유용한 기능이에요 ⚡',
      '저도 처음엔 몰랐던 Xcode 팁이에요 🔍',
      'Xcode 작업할 때 편했던 설정 공유해요 🛠️',
    ],
    'Development/Apple': [
      'Apple 개발하면서 배운 팁 공유합니다 🍎',
      '도움이 됐던 Apple 개발 경험이에요 💡',
    ],
    'Development/CS': [
      '개발하면서 알아두니 좋았던 내용이에요 🎯',
      '코드 품질 고민하다가 찾은 방법이에요 ✅',
      '이렇게 세팅했더니 편해지더라고요 ⚙️',
      '개발하면서 도움이 됐던 경험 공유해요 🔥',
    ],
    'Development/Language': [
      '공부하면서 정리해본 내용이에요 📚',
      '이 언어 공부하면서 정리한 걸 나눠봅니다 💪',
      '참고가 되면 좋겠어요 📝',
    ],
    'Development/Blog': [
      '블로그 운영하시는 분들 공감하실 이야기예요 ✍️',
      '블로그 만들면서 배운 걸 정리해봤어요 🌐',
      '기술 블로그 셋업하면서 겪은 경험이에요 📖',
    ],
    'Development/SCM': [
      'Git 설정하면서 편해진 것들 공유해요 🔀',
      '이 Git 설정이 도움이 많이 됐어요 ⚙️',
      '혹시 이 Git 설정 써보셨나요? 🤔',
    ],
    'Development/Server': [
      '서버 개발 환경 세팅하면서 정리한 내용이에요 🖧',
      '백엔드 시작할 때 참고했던 내용 공유해요 📋',
    ],
    'Development': [
      '개발하면서 도움이 됐던 걸 공유해봅니다 💻',
      '알아두니 편했던 개발 팁이에요 ⏰',
      '생산성 올리는 데 도움이 됐던 방법이에요 🚀',
      '저도 좀 더 일찍 알았으면 했던 내용이에요 🤔',
    ],
    'Playground/SmartHome': [
      '집에서 직접 스마트홈을 만들어봤어요 🏠',
      '스마트홈 DIY 해본 경험 공유합니다 🔧',
      '주말에 조금씩 만들어본 스마트홈이에요 🛠️',
      '직접 해보니 생각보다 재밌었어요 💪',
    ],
    'Playground/Synology': [
      'NAS 활용하면서 편했던 점 공유해요 💾',
      '시놀로지 쓰면서 알게 된 팁이에요 📦',
      'NAS 활용기를 정리해봤어요 🗄️',
    ],
    'Playground/Router': [
      '공유기 설정하면서 알게 된 점이에요 🔒',
      '네트워크 보안 관련해서 정리해본 내용이에요 🛡️',
    ],
    'Playground': [
      '직접 만들어본 경험을 공유합니다 🔧',
      '취미로 만들어본 프로젝트예요 🛠️',
      '주말 프로젝트 결과물 공유해요 📸',
    ],
    'PC/macOS': [
      '맥 쓰면서 편했던 설정 공유해요 💻',
      '이 설정 해두니 확실히 편해지더라고요 ⚡',
      '맥 설정하면서 알게 된 팁이에요 🍎',
      '혹시 이 맥 설정 써보셨나요? 🤔',
    ],
    'PC': [
      '작업할 때 편했던 설정이에요 ⚡',
      'PC 설정 꿀팁 공유합니다 💡',
    ],
    'Writing': [
      '개발자로 살면서 느낀 점을 적어봤어요 💭',
      '요즘 생각이 많아서 글로 정리해봤어요 🗣️',
      '한번쯤 같이 생각해보면 좋을 이야기예요 🤔',
    ],
    'Fundamental': [
      '기초 공부하면서 정리한 내용이에요 📐',
      '같이 기초부터 차근차근 알아봐요 🧮',
    ],
    '_default': [
      '혹시 참고가 되실까 해서 공유해봅니다 📌',
      '알아두면 유용한 팁이에요 💡',
      '도움이 되면 좋겠어요 🔖',
    ],
  },
  en: {
    'Development/Apple/iOS': [
      'An iOS tip I found really useful 📱',
      'Sharing something I learned in iOS dev 🔥',
      'Have you tried this approach? 📱',
      'This helped me a lot with iOS development 🚀',
    ],
    'Development/Apple/macOS': [
      'I tried building this on macOS 🖥️',
      'Something I learned while working on a macOS app ✨',
      'Did you know macOS could do this? 🤔',
    ],
    'Development/Apple/Xcode': [
      'A useful Xcode feature I discovered ⚡',
      'I didn\'t know about this Xcode tip at first 🔍',
      'Sharing an Xcode setup that helped me 🛠️',
    ],
    'Development/Apple': [
      'Sharing a useful Apple dev tip 🍎',
      'Something I picked up working with Apple dev 💡',
    ],
    'Development/CS': [
      'Something I found helpful as a developer 🎯',
      'A method I found while working on code quality ✅',
      'This setup made my workflow smoother ⚙️',
      'Sharing a dev experience that helped me 🔥',
    ],
    'Development/Language': [
      'Notes from my study sessions 📚',
      'I organized what I learned about this language 💪',
      'Hope this is helpful for you too 📝',
    ],
    'Development/Blog': [
      'Fellow bloggers might relate to this ✍️',
      'What I learned while building my dev blog 🌐',
      'Sharing my experience setting up a tech blog 📖',
    ],
    'Development/SCM': [
      'A Git setup that made things easier for me 🔀',
      'This Git config helped me a lot ⚙️',
      'Have you tried this Git setup? 🤔',
    ],
    'Development/Server': [
      'Notes from setting up my server environment 🖧',
      'Sharing what helped me getting started with backend 📋',
    ],
    'Development': [
      'Sharing something that helped me as a developer 💻',
      'A dev tip I found quite useful ⏰',
      'This helped me be more productive 🚀',
      'Wish I had known this a bit sooner 🤔',
    ],
    'Playground/SmartHome': [
      'I tried building a smart home myself 🏠',
      'Sharing my smart home DIY experience 🔧',
      'A weekend smart home project I worked on 🛠️',
      'It was more fun than I expected 💪',
    ],
    'Playground/Synology': [
      'Sharing what I found useful with my NAS 💾',
      'Some Synology tips I picked up 📦',
      'My NAS setup experience 🗄️',
    ],
    'Playground/Router': [
      'Something I learned while configuring my router 🔒',
      'A few notes on network security 🛡️',
    ],
    'Playground': [
      'Sharing something I built myself 🔧',
      'A hobby project I worked on 🛠️',
      'My weekend project results 📸',
    ],
    'PC/macOS': [
      'A Mac setting I found really useful 💻',
      'This setting made a nice difference for me ⚡',
      'A Mac tip I picked up recently 🍎',
      'Have you tried this Mac setting? 🤔',
    ],
    'PC': [
      'A setup that helped my workflow ⚡',
      'Sharing a handy PC tip 💡',
    ],
    'Writing': [
      'Some thoughts from my life as a developer 💭',
      'Had a lot on my mind, so I wrote it down 🗣️',
      'Something worth thinking about together 🤔',
    ],
    'Fundamental': [
      'Notes from studying the fundamentals 📐',
      'Let\'s go through the basics together 🧮',
    ],
    '_default': [
      'Sharing in case it might be helpful 📌',
      'A tip I found useful 💡',
      'Hope this helps someone out there 🔖',
    ],
  },
  ja: {
    'Development/Apple/iOS': [
      '使ってみて良かったiOSのTipsです 📱',
      'iOS開発で学んだことをシェアします 🔥',
      'この方法、試してみましたか？ 📱',
      'iOS開発で役に立った内容です 🚀',
    ],
    'Development/Apple/macOS': [
      'macOSでこんなものも作れました 🖥️',
      'macOSアプリ開発で学んだことを整理しました ✨',
      'macOSのこの機能、ご存知でしたか？ 🤔',
    ],
    'Development/Apple/Xcode': [
      'Xcodeで見つけた便利な機能です ⚡',
      '最初は知らなかったXcodeのTipsです 🔍',
      '作業が楽になったXcodeの設定をシェアします 🛠️',
    ],
    'Development/Apple': [
      'Apple開発で学んだTipsをシェアします 🍎',
      '役に立ったApple開発の経験です 💡',
    ],
    'Development/CS': [
      '開発で知っておいて良かった内容です 🎯',
      'コード品質を考えていて見つけた方法です ✅',
      'この設定にしたら楽になりました ⚙️',
      '開発で役に立った経験をシェアします 🔥',
    ],
    'Development/Language': [
      '勉強しながら整理した内容です 📚',
      'この言語を勉強して整理したものをシェアします 💪',
      '参考になれば嬉しいです 📝',
    ],
    'Development/Blog': [
      'ブログ運営されている方は共感するかもしれません ✍️',
      'ブログを作りながら学んだことを整理しました 🌐',
      '技術ブログのセットアップ経験です 📖',
    ],
    'Development/SCM': [
      'Git設定で楽になったことをシェアします 🔀',
      'このGit設定がとても役立ちました ⚙️',
      'このGit設定、試してみましたか？ 🤔',
    ],
    'Development/Server': [
      'サーバー開発環境を整えた時の記録です 🖧',
      'バックエンド始める時に参考にした内容です 📋',
    ],
    'Development': [
      '開発で役に立ったことをシェアします 💻',
      '知っておいて便利だったTipsです ⏰',
      '生産性アップに役立った方法です 🚀',
      'もう少し早く知りたかった内容です 🤔',
    ],
    'Playground/SmartHome': [
      '自宅でスマートホームを作ってみました 🏠',
      'スマートホームDIYの経験をシェアします 🔧',
      '週末に少しずつ作ったスマートホームです 🛠️',
      'やってみたら思ったより楽しかったです 💪',
    ],
    'Playground/Synology': [
      'NAS活用で便利だったことをシェアします 💾',
      'Synologyを使いながら見つけたTipsです 📦',
      'NAS活用記を整理してみました 🗄️',
    ],
    'Playground/Router': [
      'ルーター設定で気づいたことをシェアします 🔒',
      'ネットワークセキュリティについて整理しました 🛡️',
    ],
    'Playground': [
      '自分で作ってみた経験をシェアします 🔧',
      '趣味で作ったプロジェクトです 🛠️',
      '週末プロジェクトの結果をシェアします 📸',
    ],
    'PC/macOS': [
      'Macで便利だった設定をシェアします 💻',
      'この設定にしたら確かに楽になりました ⚡',
      'Mac設定で見つけたTipsです 🍎',
      'このMac設定、試してみましたか？ 🤔',
    ],
    'PC': [
      '作業が楽になった設定です ⚡',
      'PC設定の小技をシェアします 💡',
    ],
    'Writing': [
      'エンジニアとして感じたことを書いてみました 💭',
      '最近考えることが多くて文章にしてみました 🗣️',
      '一緒に考えてみると良いテーマだと思います 🤔',
    ],
    'Fundamental': [
      '基礎を勉強しながら整理した内容です 📐',
      '一緒に基礎からじっくり見ていきましょう 🧮',
    ],
    '_default': [
      '参考になるかもしれないのでシェアします 📌',
      '役に立つTipsです 💡',
      'お役に立てれば嬉しいです 🔖',
    ],
  },
};

// ---------------------------------------------------------------------------
// Reach hashtags — broader tags added to every caption for discoverability
// ---------------------------------------------------------------------------

const REACH_TAGS = {
  ko: ['#개발자', '#개발자일상', '#개발자그램', '#코딩', '#프로그래밍'],
  en: ['#developer', '#devlife', '#coding', '#programming', '#tech'],
  ja: ['#エンジニア', '#プログラミング', '#開発者', '#エンジニアライフ', '#テック'],
};

// ---------------------------------------------------------------------------
// CTA templates
// ---------------------------------------------------------------------------

const CTA = {
  ko: {
    blog: '👉 자세한 내용은 블로그에서',
    link: '🔗 프로필 링크 클릭',
    engage: '💾 저장  ❤️ 좋아요  📲 팔로우',
  },
  en: {
    blog: '👉 Full post on the blog',
    link: '🔗 Link in bio',
    engage: '💾 Save  ❤️ Like  📲 Follow',
  },
  ja: {
    blog: '👉 詳しくはブログで',
    link: '🔗 プロフィールのリンクから',
    engage: '💾 保存  ❤️ いいね  📲 フォロー',
  },
};

// ---------------------------------------------------------------------------
// Hook selection — deterministic per ref via djb2 hash
// ---------------------------------------------------------------------------

function pickHook(ref, categories, lang) {
  const l = lang || 'ko';
  const hooks = HOOKS[l] || HOOKS['ko'];

  // Try most specific category path first, then broaden
  const keys = [];
  if (categories.length >= 3) keys.push(categories.slice(0, 3).join('/'));
  if (categories.length >= 2) keys.push(categories.slice(0, 2).join('/'));
  if (categories.length >= 1) keys.push(categories[0]);
  keys.push('_default');

  let hookList;
  for (const key of keys) {
    if (hooks[key]) {
      hookList = hooks[key];
      break;
    }
  }

  const rng = createRng(ref);
  const idx = Math.floor(rng() * hookList.length);
  return hookList[idx];
}

// ---------------------------------------------------------------------------
// Key points label
// ---------------------------------------------------------------------------

const KEY_POINTS_LABEL = {
  ko: '📋 이런 내용을 다뤘어요',
  en: '📋 What\'s covered',
  ja: '📋 こんな内容です',
};

// ---------------------------------------------------------------------------
// Caption builder
// ---------------------------------------------------------------------------

function buildCaption({ title, excerpt, categories, tags, lang, ref, keyPoints }) {
  const l = lang || 'ko';
  const cta = CTA[l] || CTA['ko'];
  const reach = REACH_TAGS[l] || REACH_TAGS['ko'];
  const hook = pickHook(ref, categories, l);
  const points = keyPoints || [];

  const postTags = tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
  const reachStr = reach.join(' ');

  const lines = [
    hook,
    '',
    title,
    '',
    excerpt,
  ];

  // Key points section (only if 2+ points)
  if (points.length >= 2) {
    const label = KEY_POINTS_LABEL[l] || KEY_POINTS_LABEL['ko'];
    lines.push('', label);
    for (const p of points) {
      lines.push(`→ ${p}`);
    }
  }

  lines.push(
    '',
    cta.blog,
    cta.link,
    '',
    '—',
    '',
    cta.engage,
    HANDLE,
    '',
    '.', '.', '.',
    '',
    `${postTags} ${BRAND_TAG}`,
    reachStr,
  );

  return lines.join('\n');
}

module.exports = { buildCaption };
