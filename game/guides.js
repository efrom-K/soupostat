(function (root) {
  'use strict';

  const crew = {
    lada: { name: 'Лада', role: 'картограф' },
    mira: { name: 'Мира', role: 'кладовщица' },
    tim: { name: 'Тим', role: 'дозорный' },
  };
  const routeCrew = { survey: 'lada', supply: 'mira', relay: 'tim' };

  // Only authored game copy is passed here, including the marked-up cargo weight.
  function speech(who, words) {
    const person = crew[who];
    return '<div class="crew-speech" data-speaker="' + who + '"><span class="crew-face">' +
      root.SoupPortrait(who) + '</span><div><strong>' + person.name + '</strong><small> · ' +
      person.role + '</small><p>' + words + '</p></div></div>';
  }

  function advice(s, requested) {
    const c = s.city;
    const trip = c.voyage;
    const arrived = trip && trip.until <= s.seconds;
    const alarm = s.suspicion >= 65;
    const hungry = s.food <= 6;
    const chapter = root.SoupCity.chapters[root.SoupCity.chapter(c)];
    let who = requested;
    if (!crew[who]) {
      if (s.status === 'won') who = c.charter === 'republic' ? 'tim' : 'mira';
      else if (s.status === 'lost' || alarm) who = 'tim';
      else if (arrived) who = routeCrew[trip.id];
      else if (c.prompt !== null || (c.intro && c.chapterRead < root.SoupCity.chapter(c))) who = chapter.who;
      else if (hungry || s.event?.id === 'stir') who = 'mira';
      else if (s.event?.id === 'lamp') who = 'tim';
      else if (trip) who = routeCrew[trip.id];
      else if (s.seconds < 12 || !c.intro) who = 'lada';
      else if (!c.dispatches && !c.work) who = s.energy < 20 ? 'mira' : 'lada';
      else who = chapter.who;
    }
    const say = (words, screen, label) => ({ who, words, screen, label });
    if (s.status === 'won') {
      const after = {
        lada: 'Границу обвела чернилами. И всё-таки оставлю внизу листа место для какой-нибудь новой дороги.',
        mira: 'Праздничный пирог вышел величиной с целую горошину. Пришлось позвать всех соседей.',
        tim: 'Моя смена закончилась. Впервые могу посмотреть, как занимается утро, с этой стороны флажка.',
      };
      return say(after[who], 'story', 'Открыть дневник');
    }
    if (s.status === 'lost') return say('Последний сигнал остался на крышке. В следующий раз уйдём в покой, пока суп ещё успеет посветлеть.', 'story', 'Открыть дневник');
    if (who === 'tim' && alarm)
      return say('В щели виден глаз. Пока мы в покое, суп светлеет. Если человек узнает нас, следующей полкой станет слив.', 'rest', 'Найти режим «Покой»');
    if (arrived && who === routeCrew[trip.id])
      return say('Мы дома! Всё ещё стоим на причале с поклажей. Открой экспедиции и забери груз.', 'routes', 'К прибывшему отряду');
    if (who === chapter.who && c.prompt !== null)
      return say('У крышки собрались соседи. В дневнике записаны их просьба и цена каждого ответа. Я хочу услышать, что ты решишь.', 'story', 'На совет');
    if (who === chapter.who && c.intro && c.chapterRead < root.SoupCity.chapter(c))
      return say(chapter.testimony, 'story', 'Прочитать главу');
    if (who === 'mira') {
      if (hungry) return say('В кладовой просвечивает дно. Караван привезёт органику. Еду на дорогу он берёт свою, с нас только энергия.', 'routes', 'К караванам');
      if (s.event?.id === 'stir') return say('Ложка подняла крошки со дна! Сейчас за порцию дают больше энергии, зато суп уже помутнел.', 'modes', 'К питанию');
      if (trip?.id === 'supply' && !trip.played) return say('Тележка накренилась. Помоги подобрать три припаса по весу, и на обратном пути увезём больше.', 'routes', 'Помочь с грузом');
      if (s.energy < 20) return say('При свете фототрофы копят энергию. В темноте гетеротрофы тратят еду. В стройках есть резерв: оставь часть энергии на рейс.', 'works', 'Посмотреть резерв');
      return say('За дорогу, стройку и деление платим из одной кассы. Я сперва откладываю плату за рейс, а уж потом считаю, сколько можно потратить.', 'works', 'В мастерскую');
    }
    if (who === 'tim') {
      if (s.event?.id === 'lamp') return say('Лампа опять моргает. Пока человек её не поправит, фототрофы соберут меньше энергии. Проверь запасы.', 'modes', 'К питанию');
      if (trip?.id === 'relay' && !trip.played) return say('Соседний пост на связи. Повтори наш позывной в том же порядке. Если забудешь, я покажу ещё раз.', 'routes', 'Ответить на сигнал');
      return say('Я слежу за щелью в дверце. В темноте осмотров нет. Когда человек вернётся, он заметит и зелень, и муть.', 'modes', 'К управлению колонией');
    }
    if (!c.intro && !s.seconds) return say('Видишь записку на крышке? В воскресенье здесь будут прибираться. Включай часы. Я покажу тропу из кастрюли.', 'clock', 'К часам');
    if (trip?.id === 'survey' && !trip.played) return say('На моей карте остался разрыв. Поверни плитки в задании разведчиков, чтобы соединить берега и привезти лишний чертёж.', 'routes', 'Развернуть карту');
    if (c.work) return say('Смотри, на полке уже выросли леса. Когда бригада закончит, подойдём поближе и отметим новое здание на карте.', 'works', 'Посмотреть стройку');
    if (!c.dispatches) return say('У ободка лежат первые чертежи. Для разведки нужно 20 энергии и две порции органики. Я уже собрала карту.', 'routes', 'К разведчикам');
    return say(chapter.who === 'lada' ? chapter.testimony : 'Я помечаю на карте каждый новый дом. Загляни в дневник: там письма жителей, до которых мы добрались.', 'story', 'Открыть дневник');
  }

  root.SoupGuides = { crew, routeCrew, speech, advice };
})(globalThis);
