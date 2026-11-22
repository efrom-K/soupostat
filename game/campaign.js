(function (root) {
  'use strict';
  const projects = [
    [
      'dock',
      'Пристань на ободке',
      'Закрепить верёвочную лестницу для разведчиков.',
      6,
      2,
      0,
      1,
      4,
      0,
      35,
    ],
    [
      'pantry',
      'Общественная кладовая',
      'На полке впервые появятся пайки для ночной смены.',
      12,
      8,
      2,
      3,
      12,
      0,
      45,
    ],
    [
      'atlas',
      'Картографический стол',
      'Лада нанесёт огуречный берег на первую общую карту.',
      16,
      6,
      3,
      5,
      18,
      1,
      55,
    ],
    [
      'battery',
      'Маховик мастерской',
      'Накопитель поднимет предел запаса энергии на 20.',
      20,
      6,
      4,
      6,
      24,
      1,
      65,
    ],
    [
      'port',
      'Огуречный порт',
      'Снабженцы смогут привозить ещё 12 органики за рейс.',
      20,
      12,
      5,
      8,
      35,
      2,
      75,
    ],
    [
      'archive',
      'Архив дозорных',
      'Каждая следующая перекличка принесёт дополнительный чертёж.',
      22,
      8,
      5,
      9,
      42,
      2,
      80,
    ],
    [
      'mill',
      'Крошечная мельница',
      'Каждая двенадцатая секунда приносит 1 органику.',
      26,
      16,
      6,
      10,
      55,
      2,
      85,
    ],
    [
      'rail',
      'Сырная дорога',
      'Экспедиции станут короче на 12 игровых секунд.',
      28,
      14,
      6,
      11,
      65,
      3,
      95,
    ],
    [
      'assembly',
      'Зал собраний',
      'Откроет общее голосование о будущем города.',
      30,
      16,
      7,
      12,
      75,
      3,
      100,
    ],
    [
      'press',
      'Печатня на этикетке',
      'Новые научные признаки будут требовать на 2 энергии меньше.',
      32,
      20,
      8,
      13,
      84,
      3,
      105,
    ],
    [
      'bridge',
      'Мост к дверце',
      'Свяжет полку с дверцей перед последней доставкой.',
      36,
      20,
      8,
      14,
      96,
      3,
      110,
    ],
    [
      'capital',
      'Город под лампой',
      'Поднять общий флаг и встретить человека.',
      44,
      26,
      10,
      16,
      110,
      3,
      120,
    ],
  ].map(([id, name, detail, energy, food, dna, plans, pop, stage, duration], index) => ({
    id,
    name,
    detail,
    energy,
    food,
    dna,
    plans,
    pop,
    stage,
    duration,
    index,
  }));
  const paths = [
    [],
    [],
    ['dock'],
    ['pantry'],
    ['atlas'],
    ['atlas'],
    ['pantry', 'port'],
    ['port', 'battery'],
    ['archive', 'rail'],
    ['assembly', 'mill'],
    ['press', 'rail'],
    ['bridge', 'assembly'],
  ];
  projects.forEach((p, i) => (p.parents = paths[i]));
  const routes = [
    {
      id: 'survey',
      name: 'Разведка прохода',
      description: 'Проложите тропу между крошками.',
      energy: 20,
      food: 2,
      duration: 88,
      plans: 2,
      bonus: 1,
    },
    {
      id: 'supply',
      name: 'Караван припасов',
      description: 'Уложите груз, пока тележка у пристани.',
      energy: 12,
      food: 0,
      duration: 60,
      plans: 0,
      bonus: 1,
    },
    {
      id: 'relay',
      name: 'Перекличка дозорных',
      description: 'Передайте по цепочке позывной соседнего поста.',
      energy: 12,
      food: 3,
      duration: 72,
      plans: 1,
      bonus: 1,
    },
  ];
  const chapters = [
    {
      at: 0,
      title: 'Записка на крышке',
      place: 'Кастрюля',
      who: 'lada',
      testimony: 'У меня был один листок. На одной стороне я нарисовала наш дом, на другой пока пусто. Хочу однажды перевернуть карту и показать тебе соседей.',
      text: 'На крышке висит записка: «В воскресенье разобрать холодильник». Для человека это напоминание. Для четырёх жителей бульона — срок жизни их мира. Картограф Лада предлагает связать поселения дорогой. Первые чертежи можно добыть у ободка.',
    },
    {
      at: 2,
      title: 'Берег за стеклом',
      place: 'Огуречная банка',
      who: 'tim',
      testimony: 'Я годами отбивал флажком позывной в пустоту. А вчера мне ответили с ободка. Лада, я оставил тебе на стекле место для названия нашего поста.',
      text: 'На стекле банки дозорный Тим поднял флажок. Его жители считают кастрюлю сказкой. Лада несёт им карту, а кладовщица Мира уже считает, сколько пайков переживут ночной переход. Нужны порт и надёжная связь.',
    },
    {
      at: 5,
      title: 'Письма с сырной полки',
      place: 'Сырная корка',
      who: 'mira',
      testimony: 'Из-за корки пришёл конверт. В нём горошина и детским почерком: «Это вам на дорогу». Отложила её для мельницы. Первый мешок муки пошлю обратно.',
      text: 'В складках этикетки лежат письма от другого поселения. Там умеют хранить чертежи, но зимой пропадает дорога. Архив сохранит их знания. Мельница и сырная дорога свяжут соседей.',
    },
    {
      at: 8,
      title: 'Право на город',
      place: 'Молочный причал',
      who: 'tim',
      testimony: 'Всю жизнь я подавал один сигнал: «Прячьтесь». Сегодня Мира попросила придумать другой: «Заходите в гости». Пока учусь держать оба флажка ровно.',
      text: 'К кастрюле стекаются делегаты. Одни хотят написать человеку письмо, другие — сохранить город в тайне. Совет запоминает, кому вы помогали. Печатне понадобятся еда, энергия и чертежи.',
    },
    {
      at: 11,
      title: 'Воскресное утро',
      place: 'Дверца',
      who: 'lada',
      testimony: 'На обороте карты больше нет места. У самого порога я оставила пустую строку: здесь будет подпись нашего города. Каким именем нам представиться человеку?',
      text: 'По ту сторону кухни слышны шаги. Мост готов. Делегаты ждут последнего решения: стать соседями человека или самостоятельной республикой. Соберите столицу, пока город способен её содержать.',
    },
  ];
  const dilemmas = [
    [
      'Промокшая карта',
      'У картографов размыло отметки. Высушить карту или отдать её караванщикам?',
      ['Высушить карту', { energy: -8, plans: 2 }],
      ['Обменять на пайки', { food: 8, dna: -1 }],
    ],
    [
      'Ночные беженцы',
      'На пристани ждёт семья с пустыми корзинами.',
      ['Разделить ужин', { food: -7, dna: 3, trust: 1 }],
      ['Нанять проводника', { energy: -8, plans: 2 }],
    ],
    [
      'Ярмарка на корке',
      'Пекари предлагают обменять запасы на работу мастерской.',
      ['Поставить прилавок', { energy: -7, food: 12 }],
      ['Купить схему дороги', { food: -6, plans: 2 }],
    ],
    [
      'Размытый мостик',
      'С ободка сорвало настил. Соседи ждут помощи.',
      ['Прислать мастеров', { energy: -9, trust: 1, plans: 2 }],
      ['Дать тёплые пайки', { food: -5, dna: 2 }],
    ],
    [
      'Письмо на крышке',
      'Человек оставил на крышке сердечко. Совет спорит об ответе.',
      ['Ответить на полях', { dna: -2, trust: 2, plans: 2 }],
      ['Перенести огни в укрытие', { energy: -5, suspicion: -14 }],
    ],
    [
      'Смена караула',
      'Дозорные просят сменщиков после долгой ночи.',
      ['Отпустить домой', { food: -4, trust: 1, suspicion: -8 }],
      ['Оплатить карту смен', { energy: -6, plans: 2 }],
    ],
    [
      'Банкет у банки',
      'Свободный порт приглашает на общий стол.',
      ['Доставить угощение', { food: -6, energy: 14, trust: 1 }],
      ['Заказать припасы', { plans: -1, food: 15 }],
    ],
    [
      'Звон из архива',
      'На тонкой жестянке сохранился старый позывной.',
      ['Расшифровать запись', { energy: -8, dna: 4 }],
      ['Передать соседям', { dna: -1, trust: 1, plans: 2 }],
    ],
    [
      'Окна в темноте',
      'Жители хотят увидеть первый городской праздник.',
      ['Зажечь окна', { energy: -9, dna: 4, suspicion: 5 }],
      ['Устроить тихий ужин', { food: -5, trust: 1, suspicion: -8 }],
    ],
    [
      'Спор о межах',
      'Два причала претендуют на одну и ту же крошку.',
      ['Собрать совет', { dna: -2, trust: 2, food: 10 }],
      ['Разметить участок', { energy: -6, plans: 2 }],
    ],
  ].map(([title, text, ...choices]) => ({ title, text, choices }));
  function init() {
    return {
      built: [],
      work: null,
      voyage: null,
      plans: 1,
      reserve: 12,
      dispatches: 0,
      trust: 0,
      prompt: null,
      decisions: 0,
      nextCouncil: 85,
      intro: false,
      chapterRead: -1,
      charter: null,
    };
  }
  const chapter = (c) => chapters.filter((ch) => ch.at <= c.built.length).length - 1;
  const capacity = (s) => 52 + 4 * s.city.built.length + (s.city.built.includes('battery') ? 20 : 0);
  const housing = (s) => 80 + 6 * s.city.built.length;
  const upkeep = (s) => 2 + Math.floor(s.city.built.length / 2);
  const resources = { energy: 'энергии', food: 'органики', dna: 'очк. эволюции', plans: 'черт.' };
  function amounts(list) {
    return Object.entries(list)
      .filter(([k, v]) => resources[k] && v)
      .map(([k, v]) => Math.abs(v) + ' ' + resources[k])
      .join(' · ');
  }
  function lack(s, price) {
    return Object.keys(resources)
      .filter((k) => (price[k] || 0) > (k === 'plans' ? s.city.plans : s[k]))
      .map((k) => price[k] - (k === 'plans' ? s.city.plans : s[k]) + ' ' + resources[k])
      .join(', ');
  }
  function pay(s, price) {
    for (const k of Object.keys(resources)) {
      if (k === 'plans') s.city.plans -= price[k] || 0;
      else s[k] -= price[k] || 0;
    }
  }
  function reward(s, gain) {
    for (const [k, v] of Object.entries(gain)) {
      if (k === 'plans' || k === 'trust') s.city[k] += v;
      else if (k === 'suspicion') s[k] = Math.min(99, Math.max(0, s[k] + v));
      else if (k === 'energy' && v > 0)
        s.energy = Math.min(s.energy + v, Math.max(s.energy, capacity(s)));
      else if (k === 'dna' && v > 0) s.dna = Math.min(s.dna + v, Math.max(s.dna, 32));
      else s[k] += v;
    }
  }
  function quote(s, id) {
    const p = projects.find((x) => x.id === id),
      r = routes.find((x) => x.id === id);
    if (s.status !== 'playing') return 'Партия завершена';
    if (p) {
      if (s.city.built.includes(id)) return 'Построено';
      if (s.city.work) return 'Мастерская занята';
      const missing = p.parents.filter((k) => !s.city.built.includes(k));
      if (missing.length)
        return 'Сначала: ' + missing.map((k) => projects.find((p) => p.id === k).name).join(', ');
      if (s.pop < p.pop || s.stage < p.stage) return 'Нужно ' + p.pop + ' колоний';
      if (id === 'capital' && !s.city.charter) return 'Сначала выберите устав города';
    } else if (r && s.city.voyage) return 'Команда в экспедиции';
    const price = p || r;
    if (!price) return 'Неизвестный заказ';
    const due = lack(s, price);
    return due ? 'Не хватает: ' + due : '';
  }
  function order(state, action, id) {
    const fail = (reason) => ({ state, reason });
    if (state.status !== 'playing') return fail('Партия завершена');
    const s = { ...state, city: { ...state.city } },
      c = s.city;
    if (action === 'build' || action === 'launch') {
      const spec = (action === 'build' ? projects : routes).find((x) => x.id === id);
      if (!spec) return fail('Неизвестный заказ');
      const error = quote(s, id);
      if (error) return fail(error);
      pay(s, spec);
      if (action === 'build') c.work = { id, until: s.seconds + spec.duration };
      else {
        c.dispatches++;
        c.voyage = {
          id,
          until: s.seconds + spec.duration - (c.built.includes('rail') ? 12 : 0),
          played: false,
          mastery: false,
          seed: (s.seed ^ Math.imul(c.dispatches, 2654435761)) >>> 0,
        };
      }
    } else if (action === 'play') {
      if (!c.voyage || c.voyage.played) return fail('Задание уже было начато');
      c.voyage = { ...c.voyage, played: true };
    } else if (action === 'master') {
      if (!c.voyage?.played || c.voyage.mastery || c.voyage.seed !== id)
        return fail('Другая экспедиция');
      c.voyage = { ...c.voyage, mastery: true };
    } else if (action === 'hurry') {
      if (!c.voyage || c.voyage.hurried || c.voyage.until <= s.seconds)
        return fail('Этот рейс уже завершается');
      if (s.energy < 22) return fail('Нужно 22 энергии');
      s.energy -= 22;
      c.voyage = { ...c.voyage, hurried: true, until: Math.max(s.seconds, c.voyage.until - 18) };
    } else if (action === 'claim') {
      if (!c.voyage || c.voyage.until > s.seconds) return fail('Отряд ещё в пути');
      reward(s, cargo(s));
      c.voyage = null;
    } else if (action === 'reserve') {
      if (![0, 12, 24].includes(id)) return fail('Неверный резерв');
      c.reserve = id;
    } else if (action === 'decide') {
      if (c.prompt === null) return fail('Совет ещё не собрался');
      if (id !== -1) {
        const option = dilemmas[c.prompt].choices[id];
        if (!option) return fail('Неизвестное решение');
        const price = Object.fromEntries(
          Object.entries(option[1])
            .filter(([k, v]) => resources[k] && v < 0)
            .map(([k, v]) => [k, -v]),
        );
        if (lack(s, price)) return fail('Не хватает: ' + lack(s, price));
        reward(s, option[1]);
      }
      c.prompt = null;
      c.decisions++;
      c.nextCouncil = s.seconds + 92 + ((s.seed + c.decisions * 17) % 48);
    } else if (action === 'charter') {
      if (chapter(c) < 4 || c.charter || !['neighbors', 'republic'].includes(id))
        return fail('Устав сейчас недоступен');
      c.charter = id;
    } else if (action === 'read') {
      c.intro = true;
      c.chapterRead = chapter(c);
    } else return fail('Неизвестное действие');
    return { state: s, reason: '' };
  }
  function cargo(s) {
    const v = s.city.voyage;
    if (!v) return {};
    const mastery = Number(v.mastery);
    if (v.id === 'supply')
      return { food: 20 + mastery * 10 + (s.city.built.includes('port') ? 12 : 0), plans: mastery };
    if (v.id === 'relay')
      return {
        energy: 12 + mastery * 5,
        dna: 2 + mastery,
        plans: 1 + mastery + Number(s.city.built.includes('archive')),
      };
    return { plans: 2 + mastery, dna: 1 };
  }
  function advance(s) {
    const c = s.city;
    if (s.seconds % 12 === 0) {
      s.energy = Math.max(0, s.energy - upkeep(s));
      if (c.built.includes('mill')) s.food++;
    }
    if (c.work && s.seconds >= c.work.until) {
      c.built = [...c.built, c.work.id];
      c.work = null;
    }
    if (c.prompt === null && s.seconds >= c.nextCouncil)
      c.prompt = (s.seed + c.decisions * 3) % dilemmas.length;
  }
  function ending(s) {
    return s.city.charter === 'neighbors'
      ? s.city.trust >= 8
        ? 'Мира развернула подписанное соседями письмо. Человек прочёл его и поставил рядом новую банку с табличкой «Посольство».'
        : 'Лада оставила записку на крышке. Человек долго смотрел на светящиеся окна, а утром поставил у кастрюли блюдце для писем.'
      : 'Тим поднял оба флага. Дозорные передали первый ритм независимой республики. Человек увидел флаги на каждой полке и закрыл дверцу. Отныне у города собственная граница.';
  }
  function valid(c) {
    const int = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
    if (
      !c ||
      !Array.isArray(c.built) ||
      c.built.length > projects.length ||
      new Set(c.built).size !== c.built.length ||
      !c.built.every((id) =>
        projects.some((p) => p.id === id && p.parents.every((k) => c.built.includes(k))),
      ) ||
      ![0, 12, 24].includes(c.reserve) ||
      !['plans', 'dispatches', 'trust', 'decisions', 'nextCouncil'].every((k) => int(c[k])) ||
      typeof c.intro !== 'boolean' ||
      !int(c.chapterRead, -1) ||
      c.chapterRead > chapter(c) ||
      ![null, 'neighbors', 'republic'].includes(c.charter) ||
      !(c.prompt === null || (int(c.prompt) && c.prompt < dilemmas.length))
    )
      return false;
    return (
      (c.work === null ||
        (c.work &&
          projects.some(
            (p) =>
              p.id === c.work.id &&
              !c.built.includes(p.id) &&
              p.parents.every((k) => c.built.includes(k)),
          ) &&
          int(c.work.until))) &&
      (c.voyage === null ||
        (c.voyage &&
          routes.some((r) => r.id === c.voyage.id) &&
          int(c.voyage.until) &&
          int(c.voyage.seed) &&
          typeof c.voyage.played === 'boolean' &&
          typeof c.voyage.mastery === 'boolean' &&
          (!c.voyage.mastery || c.voyage.played)))
    );
  }
  const api = {
    projects,
    routes,
    chapters,
    dilemmas,
    init,
    chapter,
    capacity,
    housing,
    upkeep,
    quote,
    order,
    cargo,
    advance,
    ending,
    valid,
    amounts,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoupCity = api;
})(globalThis);
