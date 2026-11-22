(function (root) {
  'use strict';

  const crew = {
    lada: { name: 'Лада', role: 'вибрион · картограф' },
    mira: { name: 'Мира', role: 'кокк · кладовщица' },
    tim: { name: 'Тим', role: 'бактериофаг · дозорный' },
  };
  const routeCrew = { survey: 'lada', supply: 'mira', relay: 'tim' };

  // Only authored game copy is passed here, including the marked-up cargo weight.
  function speech(who, words) {
    const person = crew[who];
    return '<div class="crew-speech" data-speaker="' + who + '"><span class="crew-face">' +
      root.SoupPortrait(who) + '</span><div><strong>' + person.name + '</strong><small> · ' +
      person.role + '</small><p>' + words + '</p></div></div>';
  }

  const incidents = {
    stir: ['mira', 'Ложка прошла по самому дну! Крошки всплыли. Сейчас каждая порция даёт больше энергии.'],
    crumbs: ['mira', 'Хлебный дождь! В кладовой прибавилось органики.'],
    lamp: ['tim', 'Два коротких блика… Это лампа барахлит. Пока она мигает, света на всех не хватит.'],
    fog: ['tim', 'Стекло запотело. С этой стороны видна кухня, а с той — почти ничего.'],
    frost: ['lada', 'На краю моей карты вырос иней. В такой холод колония делится медленнее.'],
    warm: ['lada', 'Сырная корка оттаяла. При делении сейчас появится больше соседей.'],
  };
  const chatter = [
    ['mira', 'Одну крошку так и не внесла в опись. Очень уж она пахла укропом.'],
    ['tim', 'Три стука по стеклу — это я. Один долгий скрип — уже человек.'],
    ['lada', 'Нашла на этикетке слово «хранить». Обвела его. Пожалуй, это хорошее имя для бухты.'],
    ['mira', 'Слышишь, как шуршит лавровый лист? У меня за ним склад. Там даже горошины не укатываются.'],
    ['tim', 'Сыр издали похож на луну. Удобно дежурить: если лун две, стекло пора протереть.'],
    ['lada', 'Обвела на карте самую большую каплю. Пока подписывала, она сползла на полполки.'],
  ];

  function nextVisit(s, heard, idleIndex = -1) {
    if (s.status !== 'playing') return null;
    const c = s.city;
    const chapter = root.SoupCity.chapter(c);
    const candidates = [];
    function line(key, who, words) { candidates.push({ key, who, words }); }
    if (s.suspicion >= 65) line('alarm', 'tim', 'У щели глаз! Переведи колонию в покой, пока человек разглядывает муть.');
    const trip = c.voyage;
    if (trip && trip.until <= s.seconds)
      line('return-' + c.dispatches, routeCrew[trip.id], 'Мы вернулись! В экспедициях тебя ждёт наш груз.');
    if (s.food <= 6) line('hungry', 'mira', 'Вижу дно кладовой. Караван припасов привезёт еду. На дорогу ему нужна только энергия.');
    if (s.event && incidents[s.event.id]) line('event-' + s.event.start, ...incidents[s.event.id]);
    if (chapter && c.chapterRead < chapter)
      line('chapter-' + chapter, root.SoupCity.chapters[chapter].who, root.SoupCity.chapters[chapter].testimony);
    if (s.stage > 0) {
      const shores = ['', 'Добралась до ободка! Отсюда хорошо видно, как пройти к огуречной банке.',
        'Рассол за стеклом — теперь наш берег. Загляни в запасы: к бульону прибавились огурцы.',
        'Следом за сырной коркой открылась целая полка. Тут хватит места и для мельницы, и для дороги.'];
      if (shores[s.stage]) line('shore-' + s.stage, 'lada', shores[s.stage]);
    }
    if (c.prompt !== null) line('council-' + c.decisions, 'tim', 'Со всех причалов идут сигналы. В дневнике собирается совет — соседи ждут твоего решения.');
    if (!c.intro) line('welcome', 'lada', 'Плыви за моим жгутиком! Видишь записку на крышке? Включай часы — прочитаем, что там задумал человек.');
    if (c.intro && s.seconds < 22) line('departure', 'lada', 'Есть ход к ободку. Для первой разведки соберём двадцать энергии и две порции органики.');
    if (s.seconds >= 12 && !c.built.length)
      line('reserve', 'mira', 'Я откладываю энергию на дорогу. В стройках можно задать резерв, чтобы деление не съело весь запас.');
    if (s.seconds >= 20 && s.seconds % 60 >= 20)
      line('night', 'tim', 'Дверца закрылась. Я слышу только компрессор. В темноте нас никто не увидит, но до утра придётся питаться органикой.');
    const fresh = candidates.find((item) => !heard.has(item.key));
    if (fresh || idleIndex < 0) return fresh || null;
    const [who, words] = chatter[idleIndex % chatter.length];
    return { key: 'idle', who, words };
  }

  root.SoupGuides = { crew, routeCrew, speech, nextVisit };
})(globalThis);
